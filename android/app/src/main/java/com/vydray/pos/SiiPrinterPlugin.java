package com.vydray.pos;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.util.Log;

import com.seikoinstruments.sdk.thermalprinter.PrinterManager;
import com.seikoinstruments.sdk.thermalprinter.PrinterException;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterBold;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterUnderline;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterReverse;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterFont;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterScale;
import com.seikoinstruments.sdk.thermalprinter.printerenum.PrintAlignment;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CuttingMethod;

import java.util.Set;

@CapacitorPlugin(name = "SiiPrinter")
public class SiiPrinterPlugin extends Plugin {
    private static final String TAG = "SiiPrinterPlugin";
    private PrinterManager printerManager;
    private BluetoothAdapter bluetoothAdapter;

    @Override
    public void load() {
        super.load();
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        printerManager = new PrinterManager(getContext());
    }

    @PluginMethod
    public void enable(PluginCall call) {
        try {
            if (bluetoothAdapter == null) {
                call.reject("Bluetooth not supported");
                return;
            }

            // Android 12以降の権限チェック
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                if (getContext().checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    call.reject("Bluetooth permission not granted. Please enable in device settings.");
                    return;
                }
            }

            if (!bluetoothAdapter.isEnabled()) {
                // 権限エラーを回避するため、すでに有効な場合はスキップ
                call.resolve();
                return;
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Enable error: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        try {
            // Android 12以降の権限チェック
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                if (getContext().checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    Log.e(TAG, "BLUETOOTH_CONNECT permission not granted");
                    call.reject("Bluetooth permission not granted");
                    return;
                }
            }
            
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            JSArray devices = new JSArray();
            
            for (BluetoothDevice device : pairedDevices) {
                JSObject deviceInfo = new JSObject();
                deviceInfo.put("name", device.getName());
                deviceInfo.put("address", device.getAddress());
                devices.put(deviceInfo);
            }

            JSObject result = new JSObject();
            result.put("devices", devices);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get paired devices", e);
            call.reject("Failed to get paired devices", e);
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        
        if (address == null) {
            call.reject("Address is required");
            return;
        }

        try {
            // MP-B20のモデル番号は6
            int modelNumber = PrinterManager.PRINTER_MODEL_MP_B20;
            // Bluetooth接続（セキュア接続）
            printerManager.connect(modelNumber, address, true);
            call.resolve();
        } catch (PrinterException e) {
            call.reject("Failed to connect: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            printerManager.disconnect();
            call.resolve();
        } catch (PrinterException e) {
            call.reject("Failed to disconnect", e);
        }
    }

    @PluginMethod
    public void printText(PluginCall call) {
        String text = call.getString("text");
        
        if (text == null) {
            call.reject("Text is required");
            return;
        }

        try {
            // シンプルなテキスト印刷
            printerManager.sendText(text);
            
            // カット
            printerManager.cutPaper(CuttingMethod.CUT_PARTIAL);
            
            call.resolve();
        } catch (PrinterException e) {
            call.reject("Failed to print: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void printOrderSlip(PluginCall call) {
        try {
            // パラメータを取得
            String tableName = call.getString("tableName", "");
            String guestName = call.getString("guestName", "");
            String castName = call.getString("castName", "");
            String elapsedTime = call.getString("elapsedTime", "");
            String timestamp = call.getString("timestamp", "");

            int subtotal = call.getInt("subtotal", 0);
            int serviceTax = call.getInt("serviceTax", 0);
            int roundedTotal = call.getInt("roundedTotal", 0);
            int roundingAdjustment = call.getInt("roundingAdjustment", 0);

            // カード手数料と支払い方法
            int cardFeeRate = call.getInt("cardFeeRate", 0);
            int cardFee = call.getInt("cardFee", 0);
            int roundingUnit = call.getInt("roundingUnit", 1);
            int roundingMethod = call.getInt("roundingMethod", 0);
            int paymentCash = call.getInt("paymentCash", 0);
            int paymentCard = call.getInt("paymentCard", 0);
            int paymentOther = call.getInt("paymentOther", 0);
            String paymentOtherMethod = call.getString("paymentOtherMethod", "");

            JSArray orderItems = call.getArray("orderItems");
            
            // 日本語対応
            printerManager.setCodePage(PrinterManager.CODE_PAGE_KATAKANA);
            printerManager.setInternationalCharacter(PrinterManager.COUNTRY_JAPAN);
            
            // レシート内容を構築
            StringBuilder receipt = new StringBuilder();
            
            // ヘッダー
            receipt.append("        会計伝票\n");  // スペースで中央寄せを模擬
            receipt.append("================================\n");
            
            // 基本情報
            receipt.append("卓番号: ").append(tableName).append("\n");
            receipt.append("お客様: ").append(guestName).append("\n");
            receipt.append("推し: ").append(castName).append("\n");
            receipt.append("滞在時間: ").append(elapsedTime).append("\n");
            receipt.append("印刷時刻: ").append(timestamp).append("\n");
            receipt.append("================================\n");
            
            // 注文明細
            receipt.append("【注文明細】\n");
            if (orderItems != null) {
                try {
                    // orderItemsをJSONArrayとして処理
                    org.json.JSONArray jsonArray = new org.json.JSONArray(orderItems.toString());
                    
                    for (int i = 0; i < jsonArray.length(); i++) {
                        org.json.JSONObject item = jsonArray.getJSONObject(i);
                        String name = item.optString("name", "");
                        String cast = item.optString("cast", "");
                        int quantity = item.optInt("quantity", 1);
                        int price = item.optInt("price", 0);
                        int total = quantity * price;
                        
                        // 商品名
                        receipt.append(name).append("\n");
                        
                        // キャスト名がある場合
                        if (!cast.isEmpty()) {
                            receipt.append("  (").append(cast).append(")\n");
                        }
                        
                        // 数量と金額
                        receipt.append(String.format("  %d × ¥%,d = ¥%,d\n", quantity, price, total));
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to parse order items", e);
                }
            }
            
            receipt.append("--------------------------------\n");
            
            // 合計
            receipt.append(String.format("小計:              ¥%,d\n", subtotal));
            receipt.append(String.format("サービス料:        ¥%,d\n", serviceTax));
            
            if (roundingAdjustment != 0) {
                String sign = roundingAdjustment < 0 ? "-" : "+";
                receipt.append(String.format("端数調整:         %s¥%,d\n", sign, Math.abs(roundingAdjustment)));
            }
            
            receipt.append("================================\n");

            // 合計金額
            receipt.append(String.format("合計金額:          ¥%,d\n", roundedTotal));

            receipt.append("================================\n");

            // お支払い方法による金額（カード手数料が設定されている場合のみ表示）
            if (cardFeeRate > 0) {
                // カード支払い時の金額を計算
                Log.d(TAG, "=== Card Payment Calculation Debug ===");
                Log.d(TAG, "roundedTotal: " + roundedTotal);
                Log.d(TAG, "cardFeeRate: " + cardFeeRate);
                Log.d(TAG, "roundingUnit: " + roundingUnit);
                Log.d(TAG, "roundingMethod: " + roundingMethod);

                int calculatedCardFee = (int) Math.round(roundedTotal * cardFeeRate / 100.0);
                Log.d(TAG, "calculatedCardFee: " + calculatedCardFee);

                int cardAmountBeforeRounding = roundedTotal + calculatedCardFee;
                Log.d(TAG, "cardAmountBeforeRounding: " + cardAmountBeforeRounding);

                int cardAmount = applyRounding(cardAmountBeforeRounding, roundingUnit, roundingMethod);
                Log.d(TAG, "cardAmount (after rounding): " + cardAmount);

                receipt.append("\n【お支払い方法】\n");
                receipt.append(String.format("現金の場合:        ¥%,d\n", roundedTotal));
                receipt.append(String.format("カードの場合:      ¥%,d\n", cardAmount));
                receipt.append(String.format("  (カード手数料%d%%含む)\n", cardFeeRate));
                receipt.append("================================\n");
            }

            // 一括で印刷
            printerManager.sendText(receipt.toString());
            
            // カット
            printerManager.cutPaper(CuttingMethod.CUT_PARTIAL);
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to print order slip: " + e.getMessage(), e);
        }
    }

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
            int cardFeeRate = call.getInt("cardFeeRate", 0);
            int cardFee = call.getInt("cardFee", 0);
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
            // 収入印紙が必要な場合（MP-B20用: 32文字幅）
            receipt.append("\n");
            receipt.append("       領 収 書       ┌────┐\n");
            receipt.append("                     │      │\n");
            receipt.append("                     │ 収入 │\n");
            receipt.append("                     │ 印紙 │\n");
            
            // 金額に応じた印紙額を表示
            String stampAmount = "";
            if (roundedTotal >= 5000000) {
                stampAmount = "2,000";
            } else if (roundedTotal >= 3000000) {
                stampAmount = "1,000";
            } else if (roundedTotal >= 2000000) {
                stampAmount = "600";
            } else if (roundedTotal >= 1000000) {
                stampAmount = "400";
            } else if (roundedTotal >= 50000) {
                stampAmount = "200";
            }
            receipt.append("                     │").append(String.format("%6s", stampAmount)).append("│\n");
            receipt.append("                     └────┘\n");
        } else {
            // 収入印紙が不要な場合
            receipt.append("\n");
            receipt.append("          領 収 書          \n");
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

            // 支払い内訳（カード手数料が設定されている場合のみ表示）
            if (cardFeeRate > 0) {
                receipt.append("【お支払い内訳】\n");
                receipt.append(String.format("現金:              ¥%,d\n", paymentCash));
                receipt.append(String.format("カード:            ¥%,d\n", paymentCard));
                if (cardFee > 0) {
                    receipt.append(String.format("カード手数料(%d%%):  ¥%,d\n", cardFeeRate, cardFee));
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

    // 端数処理を適用するヘルパーメソッド
    private int applyRounding(int amount, int roundingUnit, int roundingMethod) {
        if (roundingUnit <= 1) {
            return amount;
        }

        int remainder = amount % roundingUnit;

        if (remainder == 0) {
            return amount;
        }

        switch (roundingMethod) {
            case 0: // 切り上げ
                return amount - remainder + roundingUnit;
            case 1: // 切り捨て
                return amount - remainder;
            case 2: // 四捨五入
                if (remainder >= roundingUnit / 2.0) {
                    return amount - remainder + roundingUnit;
                } else {
                    return amount - remainder;
                }
            default:
                return amount;
        }
    }
}