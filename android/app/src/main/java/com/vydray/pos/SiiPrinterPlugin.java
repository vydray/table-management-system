@PluginMethod
public void printReceipt(PluginCall call) {
    try {
        // パラメータを取得
        String storeName = call.getString("storeName", "");
        String storeAddress = call.getString("storeAddress", "");
        String storePhone = call.getString("storePhone", "");
        String storePostalCode = call.getString("storePostalCode", "");
        String storeRegistrationNumber = call.getString("storeRegistrationNumber", "");
        String receiptNumber = call.getString("receiptNumber", "");
        String tableName = call.getString("tableName", "");
        String guestName = call.getString("guestName", "");
        String castName = call.getString("castName", "");
        String timestamp = call.getString("timestamp", "");
        String receiptTo = call.getString("receiptTo", "");  // 宛名
        String receiptNote = call.getString("receiptNote", "お品代として");  // 但し書き
        
        int subtotal = call.getInt("subtotal", 0);
        int serviceTax = call.getInt("serviceTax", 0);
        int consumptionTax = call.getInt("consumptionTax", 0);
        int roundingAdjustment = call.getInt("roundingAdjustment", 0);
        int roundedTotal = call.getInt("roundedTotal", 0);
        int paymentCash = call.getInt("paymentCash", 0);
        int paymentCard = call.getInt("paymentCard", 0);
        int paymentOther = call.getInt("paymentOther", 0);
        String paymentOtherMethod = call.getString("paymentOtherMethod", "");
        int change = call.getInt("change", 0);
        
        // 収入印紙設定
        boolean showRevenueStamp = call.getBoolean("showRevenueStamp", true);
        int revenueStampThreshold = call.getInt("revenueStampThreshold", 50000);
        
        JSArray orderItems = call.getArray("orderItems");
        
        // 日本語対応
        printerManager.setCodePage(PrinterManager.CODE_PAGE_KATAKANA);
        printerManager.setInternationalCharacter(PrinterManager.COUNTRY_JAPAN);
        
        // レシート内容を構築
        StringBuilder receipt = new StringBuilder();
        
        // ヘッダー部分（領収書タイトルと収入印紙欄）
        if (showRevenueStamp && roundedTotal >= revenueStampThreshold) {
            // 収入印紙が必要な場合
            receipt.append("\n");
            receipt.append("         領 収 書         ┌─────────┐\n");
            receipt.append("                         │         │\n");
            receipt.append("                         │  収入   │\n");
            receipt.append("                         │  印紙   │\n");
            
            // 金額に応じた印紙額を表示
            String stampAmount = "";
            if (roundedTotal >= 5000000) {
                stampAmount = "2,000円";
            } else if (roundedTotal >= 3000000) {
                stampAmount = "1,000円";
            } else if (roundedTotal >= 2000000) {
                stampAmount = "600円";
            } else if (roundedTotal >= 1000000) {
                stampAmount = "400円";
            } else if (roundedTotal >= 50000) {
                stampAmount = "200円";
            }
            receipt.append("                         │").append(String.format("%-9s", stampAmount)).append("│\n");
            receipt.append("                         └─────────┘\n");
        } else {
            // 収入印紙が不要な場合
            receipt.append("\n");
            receipt.append("              領 収 書              \n");
            receipt.append("\n");
        }
        
        receipt.append("\n");
        
        // 発行日
        receipt.append(timestamp).append("\n");
        receipt.append("\n");
        
        // 宛名
        if (!receiptTo.isEmpty()) {
            receipt.append(receiptTo).append(" 様\n");
        } else {
            receipt.append("                    様\n");
        }
        receipt.append("\n");
        
        // 金額（大きく表示）
        receipt.append("================================\n");
        receipt.append(String.format("  金額  ￥%,d－  \n", roundedTotal));
        receipt.append("================================\n");
        receipt.append("\n");
        
        // 但し書き
        receipt.append("但し ").append(receiptNote).append("\n");
        receipt.append("\n");
        
        // 内訳
        receipt.append("【内訳】\n");
        receipt.append("--------------------------------\n");
        
        // 注文明細
        if (orderItems != null) {
            try {
                org.json.JSONArray jsonArray = new org.json.JSONArray(orderItems.toString());
                
                for (int i = 0; i < jsonArray.length(); i++) {
                    org.json.JSONObject item = jsonArray.getJSONObject(i);
                    String name = item.optString("name", "");
                    String cast = item.optString("cast", "");
                    int quantity = item.optInt("quantity", 1);
                    int price = item.optInt("price", 0);
                    int total = quantity * price;
                    
                    receipt.append(name);
                    if (!cast.isEmpty()) {
                        receipt.append(" (").append(cast).append(")");
                    }
                    receipt.append("\n");
                    receipt.append(String.format("  %d × ¥%,d = ¥%,d\n", quantity, price, total));
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to parse order items", e);
            }
        }
        
        receipt.append("--------------------------------\n");
        
        // 小計・税金
        int taxBase = subtotal + serviceTax;  // 税込金額
        int taxAmount = consumptionTax;       // 消費税額
        
        receipt.append(String.format("税込金額:          ¥%,d\n", taxBase + taxAmount));
        receipt.append(String.format("（内消費税等:      ¥%,d）\n", taxAmount));
        
        if (roundingAdjustment != 0) {
            String sign = roundingAdjustment < 0 ? "-" : "+";
            receipt.append(String.format("端数調整:         %s¥%,d\n", sign, Math.abs(roundingAdjustment)));
        }
        
        receipt.append("\n");
        receipt.append("上記正に領収いたしました\n");
        receipt.append("\n");
        
        // 支払い方法の記載（必要に応じて）
        if (paymentCard > 0 || paymentOther > 0) {
            receipt.append("【お支払い方法】\n");
            if (paymentCash > 0) {
                receipt.append(String.format("現金:     ¥%,d\n", paymentCash));
            }
            if (paymentCard > 0) {
                receipt.append(String.format("カード:   ¥%,d\n", paymentCard));
            }
            if (paymentOther > 0) {
                String method = paymentOtherMethod.isEmpty() ? "その他" : paymentOtherMethod;
                receipt.append(String.format("%s: ¥%,d\n", method, paymentOther));
            }
            receipt.append("\n");
        }
        
        // 発行者情報
        receipt.append("================================\n");
        receipt.append(storeName).append("\n");
        
        if (!storePostalCode.isEmpty()) {
            receipt.append("〒").append(storePostalCode).append("\n");
        }
        
        if (!storeAddress.isEmpty()) {
            receipt.append(storeAddress).append("\n");
        }
        
        if (!storePhone.isEmpty()) {
            receipt.append("TEL: ").append(storePhone).append("\n");
        }
        
        // インボイス登録番号
        if (!storeRegistrationNumber.isEmpty()) {
            receipt.append("登録番号: ").append(storeRegistrationNumber).append("\n");
        }
        
        receipt.append("================================\n");
        
        // 領収書番号（下部に小さく）
        receipt.append("\n");
        receipt.append("No. ").append(receiptNumber).append("\n");
        
        // テーブル・担当情報（控え用）
        receipt.append("(卓: ").append(tableName);
        if (!castName.isEmpty()) {
            receipt.append(" / 担当: ").append(castName);
        }
        receipt.append(")\n\n\n");
        
        // 印刷
        printerManager.sendText(receipt.toString());
        
        // カット
        printerManager.cutPaper(CuttingMethod.CUT_PARTIAL);
        
        call.resolve();
    } catch (Exception e) {
        call.reject("Failed to print receipt: " + e.getMessage(), e);
    }
}