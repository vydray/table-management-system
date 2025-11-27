# table-management-system (POS) テーブル使用状況

## 概要
POSシステムが使用するSupabaseテーブルとその操作一覧（RLSポリシー設計用）

---

## テーブル一覧

### 1. users（ユーザー認証）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | auth/login.ts | ログイン認証 |
| SELECT | auth/register.ts | ユーザー重複チェック |
| INSERT | auth/register.ts | 新規ユーザー登録 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 2. casts（キャスト情報）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useCastData.ts | キャスト一覧取得 |
| SELECT | useAttendanceData.ts | 出勤管理用 |
| SELECT | casts/list.ts | API: キャスト一覧 |
| INSERT | useCastData.ts | キャスト追加 |
| UPDATE | useCastData.ts | キャスト情報更新 |
| UPDATE | casts/update.ts | API: キャスト更新 |
| DELETE | useCastData.ts | キャスト削除（論理削除） |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 3. products（商品）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useProductData.ts | 商品一覧取得 |
| SELECT | products.ts | API: 商品一覧 |
| SELECT | tables/checkout.ts | 会計時の商品情報 |
| INSERT | useProductData.ts | 商品追加 |
| UPDATE | useProductData.ts | 商品更新 |
| DELETE | useProductData.ts | 商品削除 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 4. product_categories（商品カテゴリ）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useProductCategory.ts | カテゴリ一覧 |
| SELECT | products.ts | API: カテゴリ一覧 |
| SELECT | tables/checkout.ts | 会計時 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 5. orders（注文/会計）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useReceiptsData.ts | レシート表示 |
| SELECT | useReportData.ts | 売上レポート |
| INSERT | tables/checkout.ts | 会計確定時 |
| UPDATE | useReceiptsData.ts | 注文情報更新 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 6. order_items（注文明細）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useReceiptsData.ts | レシート明細 |
| INSERT | tables/checkout.ts | 会計確定時 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 7. current_order_items（進行中注文）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | orders/current.ts | 現在の注文取得 |
| INSERT | orders/current.ts | 注文追加 |
| UPDATE | orders/current.ts | 注文更新 |
| DELETE | tables/clear.ts, tables/move.ts, tables/checkout.ts | テーブルクリア時 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 8. table_status（テーブル状態）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | tables/list.ts | テーブル一覧 |
| INSERT | tables/update.ts | テーブル追加 |
| UPDATE | tables/update.ts, tables/move.ts, tables/checkout.ts | テーブル状態更新 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 9. attendance（出退勤記録）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useAttendanceData.ts | 出勤状況確認 |
| SELECT | useReportData.ts | 勤怠レポート |
| SELECT | useTableManagement.ts | 出勤中キャスト |
| INSERT | useAttendanceData.ts | 出勤打刻 |
| UPDATE | useAttendanceData.ts | 退勤打刻、休憩など |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 10. attendance_statuses（出勤ステータス定義）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useAttendanceStatusData.ts | ステータス一覧 |
| SELECT | useTableManagement.ts | 出勤可能ステータス |
| SELECT | useReportSettings.ts | レポート設定 |
| INSERT | useAttendanceStatusData.ts | ステータス追加 |
| UPDATE | useAttendanceStatusData.ts | ステータス更新 |
| DELETE | useAttendanceStatusData.ts | ステータス削除 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 11. payments（支払い記録）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useReceiptPrint.ts | レシート印刷時 |
| INSERT | tables/checkout.ts | 会計確定時 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 12. system_settings（システム設定）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useSystemSettings.ts | 各種設定取得 |
| SELECT | useReceiptsData.ts | レシート設定 |
| SELECT | usePrinting.ts | 印刷設定 |
| SELECT | useReportSettings.ts | レポート設定 |
| SELECT | tables/checkout.ts | 税率設定など |
| INSERT | useSystemSettings.ts | 設定追加 |
| UPDATE | useSystemSettings.ts | 設定更新 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 13. store_settings（店舗設定）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useReceiptSettingsData.ts | レシート設定 |
| SELECT | usePrinting.ts | 印刷時の店舗情報 |
| SELECT | useReceiptPrint.ts | レシート印刷 |
| UPDATE | useReceiptSettingsData.ts | 設定更新 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 14. receipts（レシートストレージ）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useLogoUpload.ts | ロゴ取得 |
| INSERT | useLogoUpload.ts | ロゴアップロード |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 15. monthly_targets（月間目標）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | useReportSettings.ts | 目標取得 |
| UPSERT | useReportSettings.ts | 目標設定 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

### 16. cast_positions（キャストポジション）
| 操作 | 使用箇所 | 説明 |
|------|----------|------|
| SELECT | usePositionData.ts | ポジション一覧 |
| INSERT | usePositionData.ts | ポジション追加 |
| UPDATE | usePositionData.ts | ポジション更新 |

**RLSポリシー**: `store_id = auth.jwt()->>'store_id'`

---

## 認証フロー

1. **ログイン** (auth/login.ts)
   - username/passwordでusersテーブル検索
   - Supabase Auth ユーザー作成/更新（app_metadata: store_id, user_id, role）
   - セッショントークン返却

---

## 注意事項

- 全テーブルに`store_id`カラムがあり、RLSで店舗ごとのデータ分離が可能
- APIルートはservice_roleキー使用（RLSバイパス）
- クライアントサイドフックはanon key使用（RLS適用）
