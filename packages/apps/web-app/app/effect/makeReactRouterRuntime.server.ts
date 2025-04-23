import { Cause, Effect, Exit, Fiber, type Layer, ManagedRuntime, pipe } from 'effect'
import type { RuntimeFiber } from 'effect/Fiber'
import { makeFiberFailure } from 'effect/Runtime'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { ActionContext, LoaderContext, RequestContext } from '~/services/react-router/index.server'

/**
 * React RouterのローダーとアクションでEffectを使用するためのユーティリティ
 * @param layer - Effectのレイヤー（依存関係）
 * @returns effectLoaderとeffectActionを含むオブジェクト
 */
export const makeReactRouterRuntime = <LA>(layer: Layer.Layer<LA>) => {
  // 実行中のファイバーを追跡するためのセット
  const activeFibers = new Set<RuntimeFiber<unknown, unknown>>()

  // 指定されたレイヤーでランタイムを作成
  const runtime = ManagedRuntime.make(layer)

  /**
   * Effectを実行し、結果をPromiseとして返す内部関数
   * @param body - 実行するEffect
   * @returns Effectの結果をラップしたPromise
   */
  const run = async <A, E>(body: Effect.Effect<A, E, Layer.Layer.Success<typeof layer>>) => {
    return new Promise<A>((resolve, reject) => {
      // Effectをフォークして実行
      const fiber: RuntimeFiber<A, E> = runtime.runFork(body)
      activeFibers.add(fiber)

      // ファイバーの完了を監視
      fiber.addObserver((exit) => {
        activeFibers.delete(fiber)
        if (Exit.isSuccess(exit)) {
          // 成功した場合は値を解決
          return resolve(exit.value)
        }

        if (Cause.isFailType(exit.cause)) {
          // expected errorの場合はEffectのエラーをreject
          return reject(exit.cause.error)
        }

        // 失敗した場合はエラーを作成してreject
        const failure = makeFiberFailure(exit.cause)
        const error = new Error()
        error.message = failure.message
        error.name = failure.name
        error.stack = Cause.pretty(exit.cause)
        return reject(error)
      })
    })
  }

  /**
   * React RouterのローダーとしてEffectを使用するためのユーティリティ
   * @param body - 実行するEffect
   * @returns React Routerのローダー関数
   */
  const effectLoader =
    <A, E>(body: Effect.Effect<A, E, Layer.Layer.Success<typeof layer> | LoaderContext | RequestContext>) =>
    (args: LoaderFunctionArgs) =>
      run(pipe(body, Effect.provideService(LoaderContext, args), Effect.provideService(RequestContext, args)))

  /**
   * React RouterのアクションとしてEffectを使用するためのユーティリティ
   * @param body - 実行するEffect
   * @returns React Routerのアクション関数
   */
  const effectAction = <A, E>(
    body: Effect.Effect<A, E, Layer.Layer.Success<typeof layer> | ActionContext | RequestContext>,
  ) =>
    // biome-ignore format:
    (args: ActionFunctionArgs) => run(
      pipe(
        body,
        Effect.provideService(ActionContext, args),
        Effect.provideService(RequestContext, args)
      )
    )

  // プロセス終了時の後始末
  let closed = false

  /**
   * プロセス終了時に呼び出される関数
   * 実行中のすべてのファイバーを中断し、プロセスを正常に終了させる
   */
  const onExit = () => {
    // 既に終了処理が実行されている場合は何もしない
    if (closed) {
      return
    }
    closed = true

    /**
     * すべてのアクティブなファイバーを中断するEffect
     * ファイバーがまだ残っている場合は再帰的に実行する
     */
    const interruptAllEffect: Effect.Effect<void> =
      // biome-ignore format:
      pipe(
        Fiber.interruptAll(activeFibers),
        Effect.flatMap(() => activeFibers.size > 0 ? interruptAllEffect : Effect.void)
      )

    /**
     * プロセスのイベントリスナーを削除するEffect
     */
    const removeListenersEffect = Effect.sync(() => {
      process.removeListener('SIGINT', onExit)
      process.removeListener('SIGTERM', onExit)
    })

    // すべてのファイバーを中断し、リスナーを削除した後にプロセスを終了
    Effect.runPromise(
      pipe(
        interruptAllEffect,
        Effect.flatMap(() => removeListenersEffect),
      ),
    ).then(() => {
      process.exit(0)
    })
  }

  // プロセスが終了したときに稼働中のFiberを全て停止する
  process.on('SIGINT', onExit)
  process.on('SIGTERM', onExit)

  return { effectLoader, effectAction }
}
