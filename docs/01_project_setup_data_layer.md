# 01 プロジェクトセットアップ・データ層構築

## 概要
アプリ全体の基盤となるローカルデータ永続化層を構築する。expo-sqlite と Drizzle ORM を導入し、Task / SubTask / TimeLog の3エンティティに対応するスキーマを定義する。以降の全機能はこの基盤の上に実装されるため、最初に着手する。

## 詳細要件
- expo-sqlite, drizzle-orm（および drizzle-kit）の導入
- Task テーブル定義: id, タイトル, 作成日, 完了状態
- SubTask テーブル定義: id, タスクID(FK), 名称, 重み(%), 進捗(%), 並び順
- TimeLog テーブル定義: id, タスクID(FK), 日付, 自己申告時間(分)
- マイグレーション/スキーマ生成の仕組みを整備する
- DB接続・クエリ実行のためのユーティリティ層(リポジトリ関数など)を用意する
- NativeWind(Tailwind) のセットアップ確認・導入
- @react-native-community/slider, react-native-svg の導入

## Todoリスト
- [x] 要件定義・仕様確認
- [x] 設計・タスク分解
- [x] 実装
- [x] テスト作成・実行
- [ ] レビュー・マージ
