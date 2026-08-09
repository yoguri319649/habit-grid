# 10 単体テスト仕様書

## 概要
02〜09で実装した機能(データ層のリポジトリ関数、進捗計算・コントリビューショングラフ等のロジック、React コンポーネント)に対する単体テストの仕様を定義する。本ドキュメントは実装に先立つテスト仕様の合意を目的とし、テストコード自体は別途このドキュメントに基づいて作成する。

## テスト方針

### フレームワーク
本プロジェクトは TypeScript / Expo (React Native) 製のため、JUnit に相当する xUnit 系フレームワークとして **Jest**(Expo公式プリセット `jest-expo`)を採用する。JUnit の「テストクラス」「テストメソッド」は、Jest では以下のように対応する。

| JUnit | Jest |
|---|---|
| テストクラス (`class FooTest`) | `describe('Foo', () => { ... })` |
| テストメソッド (`@Test void ...`) | `it('...', () => { ... })` / `test('...', () => { ... })` |
| `@BeforeEach` | `beforeEach(() => { ... })` |
| アサーション (`assertEquals` 等) | `expect(...).toBe(...)` 等 |

以降「テストクラス」「テストメソッド」という言葉は、上表の対応に従い Jest の `describe`/`it` を指すものとする。

### 追加が必要な devDependencies
- `jest`, `jest-expo`, `@types/jest`
- `@testing-library/react-native`(コンポーネントのレンダリングテスト用)
- `better-sqlite3`, `@types/better-sqlite3`(リポジトリ層のテスト用インメモリDB。`expo-sqlite` はネイティブモジュールのため Jest 環境では動作しないため)

### DB依存のテストの扱い
`src/db/repositories/*.ts` は `@/db/client` が export する `db`(`drizzle-orm/expo-sqlite`)を直接 import して使用している。Jest 環境では `expo-sqlite` は実行できないため、テスト実行時のみ `drizzle-orm/better-sqlite3` + インメモリ SQLite に差し替える(Jest の `moduleNameMapper` で `@/db/client` をテスト用クライアントへエイリアスする)。スキーマ(`src/db/schema.ts`)はテスト用DBでも共用し、各テスト前にマイグレーション相当のテーブル作成を行う。

### テストファイルの配置
対象ファイルと同じディレクトリに `*.test.ts` / `*.test.tsx` を配置する(例: `src/lib/progress.ts` → `src/lib/progress.test.ts`)。

### 対象外とするもの(今回のスコープ外)
- **`src/hooks/use-tasks.ts` 等の `useLiveQuery` を直接使うフック**: `expo-sqlite` のネイティブ変更通知に依存するため、Jest でのユニットテストは対象外とする。`useOverallProgress` のみ、依存フックをモックして計算ロジックとフォールバック挙動を検証する。
- **`src/app/**` の画面コンポーネント**: 複数フック・ナビゲーション・DBを組み合わせた画面単位の検証であり、ユニットテストというより結合テストに近いため対象外とする(これまで通りシミュレータでの目視確認で担保する)。
- **`src/components/themed-text.tsx` / `themed-view.tsx` / `animated-icon.*` など、02〜09で新規実装していない既存テンプレートのコンポーネント**。

---

## テスト対象一覧と優先度

| # | 対象 | 種別 | 優先度 |
|---|---|---|---|
| 1 | `src/lib/progress.ts` | 純粋関数 | 高 |
| 2 | `src/lib/contribution.ts` | 純粋関数 | 高 |
| 3 | `src/lib/date.ts` | 純粋関数 | 高 |
| 4 | `src/db/repositories/subtasks.ts`(`distributeProportionally`/`sumWeights`) | 純粋関数 | 高 |
| 5 | `src/db/repositories/tasks.ts` | DB依存 | 高 |
| 6 | `src/db/repositories/subtasks.ts`(DB操作関数) | DB依存 | 高 |
| 7 | `src/db/repositories/timelogs.ts` | DB依存 | 高 |
| 8 | `src/hooks/use-overall-progress.ts` | フック(依存モック) | 中 |
| 9 | `src/components/progress-bar.tsx` | コンポーネント | 中 |
| 10 | `src/components/subtask-progress-slider.tsx` | コンポーネント | 中 |
| 11 | `src/components/time-chip-row.tsx` | コンポーネント | 中 |
| 12 | `src/components/contribution-graph.tsx` | コンポーネント | 中 |

---

## 1. `calculateWeightedProgress`(`src/lib/progress.ts`)

テストクラス: `calculateWeightedProgress`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| サブタスクが0件の場合はnullを返す | `[]` | `null` |
| サブタスク1件(重み100)はその進捗をそのまま返す | `[{weight:100, progress:33}]` | `33` |
| 複数サブタスクの加重平均を計算する | `[{weight:70,progress:50},{weight:30,progress:100}]` | `65` |
| 重みの合計が0の場合は0を返す(ゼロ除算ガード) | `[{weight:0,progress:100}]` | `0` |
| 加重平均の端数は四捨五入される | `[{weight:1,progress:0},{weight:2,progress:100}]` | `Math.round(200/3)` = `67` |

## 2. `src/lib/contribution.ts`

テストクラス: `levelForMinutes`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| 0分は level 0 | `0` | `0` |
| 29分は level 1(境界値) | `29` | `1` |
| 30分は level 2(境界値) | `30` | `2` |
| 59分は level 2(境界値) | `59` | `2` |
| 60分は level 3(境界値) | `60` | `3` |
| 119分は level 3(境界値) | `119` | `3` |
| 120分は level 4(境界値) | `120` | `4` |
| 120分を超えても level 4 | `500` | `4` |

テストクラス: `buildContributionGrid`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| weeks × 7 のグリッドを生成する | `weeks=12` | 12列 × 各列7セル |
| 各列の先頭セルは日曜日である | 任意の `today` | 各週配列の0番目の `date` の曜日が日曜(`getDay() === 0`) |
| 最終セルは今週の土曜日である | `today` を固定(例: 水曜) | 最後のセルの `date` が今週土曜日と一致 |
| 全セルの日付が1日間隔で連続している | - | 隣接セル間の日数差が常に1 |
| 該当日の `minutes` が正しく反映される | `timeLogs=[{date:'2026-08-05',minutes:45}]`, `today=2026-08-05` | 該当セルの `minutes===45`, `level===2` |
| 記録がない日は0分・level0になる | 上記以外の日付 | `minutes===0`, `level===0` |

## 3. `src/lib/date.ts`

テストクラス: `toDateString`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| 1桁の月・日はゼロ埋めされる | `new Date(2026,0,5)` | `"2026-01-05"` |
| 2桁の月・日はそのまま出力される | `new Date(2026,10,25)` | `"2026-11-25"` |

テストクラス: `todayDateString`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| 現在時刻を `toDateString` と同じ形式で返す | `jest.useFakeTimers().setSystemTime(...)` でシステム時刻を固定 | 固定した日付が期待通りの文字列で返る |

## 4. `distributeProportionally` / `sumWeights`(`src/db/repositories/subtasks.ts`)

テストクラス: `distributeProportionally`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| 重み比率に応じて total を配分する | `total=50, weights=[33,33]` | `[25,25]` |
| 重みが全て0の場合は均等配分する | `total=70, weights=[0,0,0]` | 合計70で概ね均等(`[24,23,23]`) |
| 配分結果の合計は常に total と一致する(最大剰余法) | `total=100, weights=[1,1,1,1,1,1,1]` | 各要素の合計が`100`と一致 |
| 要素が1つの場合は全量を割り当てる | `total=100, weights=[40]` | `[100]` |
| 空配列を渡すと空配列を返す | `total=100, weights=[]` | `[]` |

テストクラス: `sumWeights`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| 重みの合計を返す | `[{weight:10},{weight:20}]` | `30` |
| 空配列の場合は0を返す | `[]` | `0` |

## 5. `taskRepository`(`src/db/repositories/tasks.ts`, インメモリDB使用)

テストクラス: `taskRepository`

| テストメソッド | 操作 | 期待結果 |
|---|---|---|
| createTask はタイトル・作成日時・completed=false で登録する | `createTask("引っ越し")` | 返り値の `title==="引っ越し"`, `completed===false`, `createdAt` が設定される |
| renameTask はタイトルを更新する | `createTask` → `renameTask(id, "新タイトル")` | `getTask(id).title==="新タイトル"` |
| setTaskCompleted は完了状態を設定する | `setTaskCompleted(id, true)` | `getTask(id).completed===true` |
| deleteTask は対象タスクを削除する | `deleteTask(id)` | `getTask(id)===undefined` |
| deleteTask は紐づくサブタスク・時間記録もカスケード削除する | サブタスク・時間記録を作成後 `deleteTask(id)` | `listSubTasks(id)`/`listTimeLogs(id)` が空配列になる |
| listTasks は作成日時の降順で返す | 複数タスクを間隔を空けて作成 | 返り値が新しい順に並ぶ |
| getTask は存在しないIDに対して undefined を返す | `getTask(9999)` | `undefined` |

## 6. `subTaskRepository`(`src/db/repositories/subtasks.ts`, インメモリDB使用)

テストクラス: `subTaskRepository`

| テストメソッド | 操作 | 期待結果 |
|---|---|---|
| createSubTask は重み0で作成後、自動で均等リバランスされる | サブタスクを3件作成 | 各 `weight` の合計が100(例: 33,33,34。端数は最後の要素に寄る) |
| updateSubTaskName は名称を更新する | `updateSubTaskName(id, "新しい名前")` | `name==="新しい名前"` |
| updateSubTaskWeight は0〜100にクランプする | `updateSubTaskWeight(id, 150)` / `(id, -10)` | `weight===100` / `weight===0` |
| updateSubTaskWeight は兄弟の重みを再配分し合計100を維持する | 3件中1件を `weight=50` に変更 | 変更後の全サブタスクの `weight` 合計が100 |
| サブタスクが1件のみの場合、重みは常に100になる | 1件の状態で `updateSubTaskWeight(id, 10)` | `weight===100` |
| updateSubTaskProgress は0〜100にクランプする | `updateSubTaskProgress(id, 150)` / `(id, -10)` | `progress===100` / `progress===0` |
| deleteSubTask は削除後、残りの重みを比率配分し合計100を維持する | 3件中1件を削除 | 残り2件の `weight` 合計が100 |
| deleteSubTask は削除後に sortOrder を詰め直す | 中間の要素を削除 | 残りの `sortOrder` が `0,1,2...` と連番になる |
| reorderSubTasks は指定した順序で sortOrder を更新する | 順序を入れ替えて `reorderSubTasks` | `listSubTasks` の並び順が指定順と一致 |
| rebalanceWeightsEqually は均等割りし端数を最後の要素に寄せる | サブタスク3件で実行 | `[33,33,34]` のように合計100になる |

## 7. `timeLogRepository`(`src/db/repositories/timelogs.ts`, インメモリDB使用)

テストクラス: `timeLogRepository`

| テストメソッド | 操作 | 期待結果 |
|---|---|---|
| addTimeLog は該当日のレコードがなければ新規作成する | `addTimeLog(taskId, "2026-08-09", 30)` | 新規行が `minutes===30` で作成される |
| addTimeLog は同日に複数回呼ぶと分数を加算する(上書きしない) | 同日に対し `addTimeLog(..., 30)` → `addTimeLog(..., 15)` | 該当日の `minutes===45` |
| deleteTimeLog は対象レコードを削除する | `deleteTimeLog(id)` | `listTimeLogs(taskId)` から該当行が消える |
| listTimeLogs は日付の昇順で返す | 複数日付のログを登録 | 返り値が古い日付順に並ぶ |

## 8. `useOverallProgress`(`src/hooks/use-overall-progress.ts`, 依存フックはモック)

`useTask`/`useSubTasks` を `jest.mock` でスタブ化し、フック自体のロジック(フォールバック挙動)のみを検証する。

テストクラス: `useOverallProgress`

| テストメソッド | 入力(モック値) | 期待結果 |
|---|---|---|
| サブタスクがある場合は加重平均を返す | `useSubTasks` が `[{weight:100,progress:40}]` を返す | `40` |
| サブタスクが0件かつ未完了の場合は0を返す | `useSubTasks` が `[]`, `useTask` が `{completed:false}` | `0` |
| サブタスクが0件かつ完了済みの場合は100を返す | `useSubTasks` が `[]`, `useTask` が `{completed:true}` | `100` |

## 9. `ProgressBar`(`src/components/progress-bar.tsx`)

テストクラス: `ProgressBar`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| 0〜100の範囲内の値はそのまま幅に反映される | `progress={43}` | 内側バーの `style.width` が `"43%"` |
| 100を超える値は100にクランプされる | `progress={150}` | `style.width` が `"100%"` |
| 負の値は0にクランプされる | `progress={-10}` | `style.width` が `"0%"` |

## 10. `SubTaskProgressSlider`(`src/components/subtask-progress-slider.tsx`)

テストクラス: `SubTaskProgressSlider`

| テストメソッド | 入力/操作 | 期待結果 |
|---|---|---|
| 初期表示で progress prop の値を表示する | `progress={40}` | `"40%"` のテキストが表示される |
| スライド完了時に updateSubTaskProgress を正しい引数で呼ぶ | `onSlidingComplete(70)` を発火 | `subTaskRepository.updateSubTaskProgress` が `(subTaskId, 70)` で呼ばれる |

## 11. `TimeChipRow`(`src/components/time-chip-row.tsx`)

テストクラス: `TimeChipRow`

| テストメソッド | 操作 | 期待結果 |
|---|---|---|
| 「15分」タップで addTimeLog(taskId, today, 15) を呼ぶ | 「15分」チップを press | `timeLogRepository.addTimeLog` が該当引数で呼ばれる |
| 「30分」「1時間」も同様に正しい分数で呼ばれる | 各チップを press | 引数がそれぞれ30・60で呼ばれる |
| 「それ以上」タップで `Alert.prompt` が呼ばれる | 「それ以上」を press | `Alert.prompt` が呼ばれる |
| `Alert.prompt` で正の数値を入力すると addTimeLog が呼ばれる | コールバックに `"90"` を渡す | `addTimeLog(taskId, today, 90)` |
| `Alert.prompt` で数値以外・0以下を入力すると何もしない | コールバックに `""` / `"0"` を渡す | `addTimeLog` が呼ばれない |

## 12. `ContributionGraph`(`src/components/contribution-graph.tsx`)

テストクラス: `ContributionGraph`

| テストメソッド | 入力 | 期待結果 |
|---|---|---|
| timeLogs から計算した level に対応する色でセルが描画される | サンプルの `timeLogs` | 各 `Rect` の `fill` が対応する `level` の色と一致 |
| ライトモードとダークモードで異なる配色を使う | `useColorScheme` のモックを `light`/`dark` で切り替え | `fill` に使われる色セットが切り替わる |
| セルタップで日付と分数を表示する | セルの `onPress` を発火 | `Alert.alert` が該当日付・分数で呼ばれる |

---

## 実装メモ

- テストランナー: `jest`(`jest-expo` プリセット)。`npm test` で実行する。
- devDependencies に `jest`, `jest-expo`, `@types/jest`, `@testing-library/react-native`, `better-sqlite3`, `@types/better-sqlite3` を追加。
- `src/db/test-utils/create-test-db.ts`: `drizzle/0000_clumsy_shiva.sql`(実際のマイグレーションSQL)を読み込み、`better-sqlite3` のインメモリDBにスキーマを適用するヘルパー。各リポジトリのテストで `jest.mock('@/db/client', ...)` によりこのテストDBに差し替える。
- CSS import(`@/global.css` 等)は `jest/css-stub.js` に `moduleNameMapper` でスタブ化。
- `@testing-library/react-native` v14 の `render`/`renderHook` は非同期関数のため、テストコードでは必ず `await render(...)` / `await renderHook(...)` を使用する。また、同一ファイル内で複数回 `render` するテストでは、直後の `getByXxx`(同期)がまれに未コミットの状態を掴むことがあったため、`findByXxx`(非同期・リトライあり)を用いて安定化した。
- `ProgressBar` / `SubTaskProgressSlider` / `TimeChipRow`(の「それ以上」ボタン) / `ContributionGraph`(の各セル)には、テストで要素を特定するための `testID` を追加した。

### テスト実施中に見つかった既存の不具合(本仕様書のスコープ外・未修正)
`src/hooks/use-theme.ts` の `useTheme()` は `useColorScheme()` の戻り値が `'unspecified'` の場合のみ `'light'` にフォールバックしているが、RNの型定義上 `useColorScheme()` は `null` / `undefined` も返り得る(実際、テスト環境ではデフォルトで `undefined` が返る)。その場合 `Colors[undefined]` が `undefined` になり、`ThemedText`/`ThemedView` 等の利用箇所でクラッシュし得る。テストでは `useColorScheme` を明示的にモックして回避したが、実装側の修正は本チケットのスコープ外としたため別途対応要否を確認されたい。

## Todoリスト
- [x] 要件定義・仕様確認(本ドキュメント)
- [x] 設計・タスク分解
- [x] 実装
- [x] テスト作成・実行
- [ ] レビュー・マージ
