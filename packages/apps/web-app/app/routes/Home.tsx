import { Effect } from 'effect'
import { constVoid } from 'effect/Function'
import { ArrowRight } from 'lucide-react'
import type { FC } from 'react'
import { Link, redirect } from 'react-router'
import { css } from '../../styled-system/css'
import { container, flex, grid } from '../../styled-system/patterns'
import { effectLoader } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { Button } from '~/shared/components/ui/button'

export const loader = effectLoader(
  Effect.gen(function* () {
    // OAuth2Serviceを取得
    const { getAuthStatus } = yield* OAuth2Service
    // 認証状態を確認
    const authStatus = yield* getAuthStatus
    // ログイン済みの場合はダッシュボードにリダイレクト
    // biome-ignore format:
    return authStatus.authenticated 
      ? yield* Effect.succeed(redirect('/dashboard')) 
      : yield* Effect.succeed(constVoid())
  }),
)

const Home: FC = () => {
  return (
    <div className={css({ bg: 'gray.100', py: '16', minH: '100vh' })}>
      {/* ヒーローセクション */}
      <section className={container({ maxW: '7xl', px: '4' })}>
        <div
          className={flex({
            flexDir: { base: 'column', md: 'row' },
            gap: '8',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: '16',
          })}
        >
          <div className={css({ maxW: '2xl' })}>
            <h1
              className={css({
                fontSize: { base: '3xl', md: '4xl', lg: '5xl' },
                fontWeight: 'bold',
                lineHeight: 'tight',
                mb: '4',
              })}
            >
              <span>効率的な学習で</span>
              <br />
              <span className={css({ color: 'orange.500' })}>記憶を最適化</span>
              <span>する</span>
              <br />
              <span>フラッシュカードシステム</span>
            </h1>
            <p
              className={css({
                fontSize: { base: 'md', md: 'lg' },
                color: 'gray.600',
                mb: '8',
              })}
            >
              Kizamuは間隔反復学習を活用し、あなたの学習効率を最大化します。
              必要な時に必要な内容を復習し、長期記憶への定着を促進します。
            </p>
            <div className={flex({ gap: '4', alignItems: 'center' })}>
              <Button size="lg">
                <span>無料で始める</span>
                <ArrowRight className={css({ ml: '2', w: '4', h: '4' })} />
              </Button>
              <Link
                to="/login"
                className={css({
                  fontWeight: 'medium',
                  color: 'gray.700',
                  _hover: { textDecoration: 'underline' },
                })}
              >
                ログイン
              </Link>
            </div>
          </div>
          <div
            className={css({
              w: { base: 'full', md: '2xl' },
              h: { base: '64', md: '96' },
              position: 'relative',
              bg: 'white',
              borderRadius: 'md',
              boxShadow: 'md',
              overflow: 'hidden',
            })}
          >
            {/* ここに画像が入るプレースホルダー */}
            <div
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                w: 'full',
                h: 'full',
              })}
            >
              <svg
                className={css({ w: '16', h: '16', color: 'gray.300' })}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label="イメージプレースホルダー"
              >
                <title>イメージプレースホルダー</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className={css({ bg: 'white', py: '16' })}>
        <div className={container({ maxW: '7xl', px: '4' })}>
          <h2
            className={css({
              fontSize: { base: '2xl', md: '3xl' },
              fontWeight: 'bold',
              textAlign: 'center',
              mb: '4',
            })}
          >
            Kizamuの特徴
          </h2>
          <p
            className={css({
              textAlign: 'center',
              mb: '12',
              maxW: '3xl',
              mx: 'auto',
              color: 'gray.600',
            })}
          >
            効率的な学習をサポートする機能が満載。あなたの学習体験を変えます。
          </p>

          <div
            className={grid({
              gridTemplateColumns: { base: '1fr', md: 'repeat(3, 1fr)' },
              gap: '6',
            })}
          >
            {/* 特徴カード1 */}
            <div
              className={css({
                bg: 'white',
                p: '6',
                borderRadius: 'lg',
                boxShadow: 'sm',
                border: '1px solid',
                borderColor: 'gray.100',
              })}
            >
              <div
                className={css({
                  bg: 'red.50',
                  w: '12',
                  h: '12',
                  borderRadius: 'full',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: '4',
                })}
              >
                <svg
                  className={css({ w: '6', h: '6', color: 'red.500' })}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="間隔反復学習アイコン"
                >
                  <title>間隔反復学習アイコン</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '2' })}>間隔反復学習</h3>
              <p className={css({ color: 'gray.600' })}>
                科学的に証明された学習法を採用。忘却曲線に基づいて最適なタイミングで復習を促します。
              </p>
            </div>

            {/* 特徴カード2 */}
            <div
              className={css({
                bg: 'white',
                p: '6',
                borderRadius: 'lg',
                boxShadow: 'sm',
                border: '1px solid',
                borderColor: 'gray.100',
              })}
            >
              <div
                className={css({
                  bg: 'orange.50',
                  w: '12',
                  h: '12',
                  borderRadius: 'full',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: '4',
                })}
              >
                <svg
                  className={css({ w: '6', h: '6', color: 'orange.500' })}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="柔軟なカード管理アイコン"
                >
                  <title>柔軟なカード管理アイコン</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '2' })}>柔軟なカード管理</h3>
              <p className={css({ color: 'gray.600' })}>
                テキストと画像を組み合わせたカードを作成。タグ付けで整理し、効率的に管理できます。
              </p>
            </div>

            {/* 特徴カード3 */}
            <div
              className={css({
                bg: 'white',
                p: '6',
                borderRadius: 'lg',
                boxShadow: 'sm',
                border: '1px solid',
                borderColor: 'gray.100',
              })}
            >
              <div
                className={css({
                  bg: 'blue.50',
                  w: '12',
                  h: '12',
                  borderRadius: 'full',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: '4',
                })}
              >
                <svg
                  className={css({ w: '6', h: '6', color: 'blue.500' })}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="学習分析アイコン"
                >
                  <title>学習分析アイコン</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '2' })}>学習分析</h3>
              <p className={css({ color: 'gray.600' })}>
                詳細な学習統計で進捗を可視化。弱点を把握し、効率的に学習計画を立てられます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3ステップセクション */}
      <section className={css({ py: '16' })}>
        <div className={container({ maxW: '7xl', px: '4' })}>
          <h2
            className={css({
              fontSize: { base: '2xl', md: '3xl' },
              fontWeight: 'bold',
              textAlign: 'center',
              mb: '4',
            })}
          >
            簡単3ステップ
          </h2>
          <p
            className={css({
              textAlign: 'center',
              mb: '12',
              maxW: '3xl',
              mx: 'auto',
              color: 'gray.600',
            })}
          >
            Kizamuはシンプルで使いやすい。すぐに学習を始められます。
          </p>

          <div
            className={grid({
              gridTemplateColumns: { base: '1fr', md: 'repeat(3, 1fr)' },
              gap: '8',
              position: 'relative',
            })}
          >
            {/* ステップ1 */}
            <div className={css({ textAlign: 'center' })}>
              <div
                className={css({
                  w: '16',
                  h: '16',
                  borderRadius: 'full',
                  bg: 'orange.500',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  mx: 'auto',
                  mb: '4',
                })}
              >
                1
              </div>
              <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '2' })}>デッキを作成</h3>
              <p className={css({ color: 'gray.600' })}>学習したい内容ごとにデッキを作成します。</p>
            </div>

            {/* ステップ2 */}
            <div className={css({ textAlign: 'center' })}>
              <div
                className={css({
                  w: '16',
                  h: '16',
                  borderRadius: 'full',
                  bg: 'orange.500',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  mx: 'auto',
                  mb: '4',
                })}
              >
                2
              </div>
              <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '2' })}>カードを追加</h3>
              <p className={css({ color: 'gray.600' })}>質問と回答のペアでカードを作成し、タグで整理します。</p>
            </div>

            {/* ステップ3 */}
            <div className={css({ textAlign: 'center' })}>
              <div
                className={css({
                  w: '16',
                  h: '16',
                  borderRadius: 'full',
                  bg: 'orange.500',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  mx: 'auto',
                  mb: '4',
                })}
              >
                3
              </div>
              <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '2' })}>学習を開始</h3>
              <p className={css({ color: 'gray.600' })}>
                システムが最適なタイミングで復習を促し、効率的に記憶を定着させます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 対応セクション */}
      <section className={css({ bg: 'white', py: '16' })}>
        <div className={container({ maxW: '7xl', px: '4' })}>
          <div
            className={flex({
              flexDir: { base: 'column', md: 'row' },
              gap: '8',
              alignItems: 'center',
              justifyContent: 'space-between',
            })}
          >
            <div className={css({ maxW: '2xl' })}>
              <h2
                className={css({
                  fontSize: { base: '2xl', md: '3xl' },
                  fontWeight: 'bold',
                  mb: '4',
                })}
              >
                あらゆる学習に対応
              </h2>
              <p
                className={css({
                  color: 'gray.600',
                  mb: '8',
                })}
              >
                語学学習、資格試験対策、専門知識の習得など、あらゆる学習シーンでKizamuが力になります。
              </p>

              <div className={flex({ direction: 'column', gap: '4' })}>
                {/* 機能項目1 */}
                <div className={flex({ alignItems: 'flex-start', gap: '3' })}>
                  <div
                    className={css({
                      bg: 'orange.50',
                      w: '10',
                      h: '10',
                      borderRadius: 'full',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    })}
                  >
                    <svg
                      className={css({ w: '5', h: '5', color: 'orange.500' })}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-label="タグによる整理アイコン"
                    >
                      <title>タグによる整理アイコン</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className={css({ fontWeight: 'bold', mb: '1' })}>タグによる整理</h3>
                    <p className={css({ color: 'gray.600' })}>
                      カードにタグを付けて整理し、効率的に検索・フィルタリングできます。
                    </p>
                  </div>
                </div>

                {/* 機能項目2 */}
                <div className={flex({ alignItems: 'flex-start', gap: '3', mt: '4' })}>
                  <div
                    className={css({
                      bg: 'orange.50',
                      w: '10',
                      h: '10',
                      borderRadius: 'full',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    })}
                  >
                    <svg
                      className={css({ w: '5', h: '5', color: 'orange.500' })}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-label="マルチメディア対応アイコン"
                    >
                      <title>マルチメディア対応アイコン</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className={css({ fontWeight: 'bold', mb: '1' })}>マルチメディア対応</h3>
                    <p className={css({ color: 'gray.600' })}>
                      テキストだけでなく、画像も追加可能。視覚的な学習をサポートします。
                    </p>
                  </div>
                </div>

                {/* 機能項目3 */}
                <div className={flex({ alignItems: 'flex-start', gap: '3', mt: '4' })}>
                  <div
                    className={css({
                      bg: 'orange.50',
                      w: '10',
                      h: '10',
                      borderRadius: 'full',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    })}
                  >
                    <svg
                      className={css({ w: '5', h: '5', color: 'orange.500' })}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-label="学習スケジュール最適化アイコン"
                    >
                      <title>学習スケジュール最適化アイコン</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className={css({ fontWeight: 'bold', mb: '1' })}>学習スケジュール最適化</h3>
                    <p className={css({ color: 'gray.600' })}>
                      SM-2アルゴリズムにより、最適なタイミングで復習を促します。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={css({
                w: { base: 'full', md: '2xl' },
                h: { base: '64', md: '96' },
                position: 'relative',
                bg: 'white',
                borderRadius: 'md',
                boxShadow: 'md',
                overflow: 'hidden',
              })}
            >
              {/* ここに画像が入るプレースホルダー */}
              <div
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  w: 'full',
                  h: 'full',
                })}
              >
                <svg
                  className={css({ w: '16', h: '16', color: 'gray.300' })}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="イメージプレースホルダー"
                >
                  <title>イメージプレースホルダー</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className={css({ py: '16', bg: 'orange.50' })}>
        <div className={container({ maxW: '7xl', px: '4', textAlign: 'center' })}>
          <h2
            className={css({
              fontSize: { base: '2xl', md: '3xl' },
              fontWeight: 'bold',
              mb: '4',
            })}
          >
            今すぐ効率的な学習を始めよう
          </h2>
          <p
            className={css({
              mb: '8',
              maxW: '2xl',
              mx: 'auto',
              color: 'gray.600',
            })}
          >
            Kizamuを使って、あなたの学習効率を最大化しましょう。 無料で始められます。
          </p>
          <Button size="lg">
            <span>無料で始める</span>
            <ArrowRight className={css({ ml: '2', w: '4', h: '4' })} />
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Home
