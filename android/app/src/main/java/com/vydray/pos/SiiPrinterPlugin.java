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
            String receiptNumber = call.getString("receiptNumber", "");
            String tableName = call.getString("tableName", "");
            String guestName = call.getString("guestName", "");
            String castName = call.getString("castName", "");
            String timestamp = call.getString("timestamp", "");
            
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
            
            JSArray orderItems = call.getArray("orderItems");
            
            // 日本語対応
            printerManager.setCodePage(PrinterManager.CODE_PAGE_KATAKANA);
            printerManager.setInternationalCharacter(PrinterManager.COUNTRY_JAPAN);
            
            // レシート内容を構築
            StringBuilder receipt = new StringBuilder();
            
            // ヘッダー
            receipt.append("         領収書\n");
            receipt.append("================================\n");
            receipt.append("       ").append(storeName).append("\n");
            if (!storeAddress.isEmpty()) {
                receipt.append(storeAddress).append("\n");
            }
            if (!storePhone.isEmpty()) {
                receipt.append(storePhone).append("\n");
            }
            receipt.append("================================\n");
            receipt.append("領収書No: ").append(receiptNumber).append("\n");
            receipt.append("日時: ").append(timestamp).append("\n");
            receipt.append("卓番号: ").append(tableName).append("\n");
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
                        
                        receipt.append(name).append("\n");
                        if (!cast.isEmpty()) {
                            receipt.append("  (").append(cast).append(")\n");
                        }
                        receipt.append(String.format("  %d × ¥%,d = ¥%,d\n", quantity, price, total));
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to parse order items", e);
                }
            }
            
            receipt.append("--------------------------------\n");
            
            // 小計・税金
            receipt.append(String.format("小計:              ¥%,d\n", subtotal));
            receipt.append(String.format("サービス料(15%%):   ¥%,d\n", serviceTax));
            receipt.append(String.format("消費税(10%%):       ¥%,d\n", consumptionTax));
            
            if (roundingAdjustment != 0) {
                String sign = roundingAdjustment < 0 ? "-" : "+";
                receipt.append(String.format("端数調整:         %s¥%,d\n", sign, Math.abs(roundingAdjustment)));
            }
            
            receipt.append("================================\n");
            receipt.append(String.format("合計金額:          ¥%,d\n", roundedTotal));
            receipt.append("================================\n");
            
            // 支払い内訳
            receipt.append("【お預かり】\n");
            if (paymentCash > 0) {
                receipt.append(String.format("現金:              ¥%,d\n", paymentCash));
            }
            if (paymentCard > 0) {
                receipt.append(String.format("カード:            ¥%,d\n", paymentCard));
            }
            if (paymentOther > 0) {
                receipt.append(String.format("その他(%s):  ¥%,d\n", 
                    paymentOtherMethod.isEmpty() ? "その他" : paymentOtherMethod, paymentOther));
            }
            
            receipt.append("--------------------------------\n");
            receipt.append(String.format("お預かり計:        ¥%,d\n", paymentCash + paymentCard + paymentOther));
            
            if (change > 0) {
                receipt.append(String.format("お釣り:            ¥%,d\n", change));
            }
            
            receipt.append("================================\n");
            
            // フッター
            receipt.append("\nご利用ありがとうございました\n");
            receipt.append("またのご来店をお待ちしております\n\n\n");
            
            // 印刷
            printerManager.sendText(receipt.toString());
            
            // カット
            printerManager.cutPaper(CuttingMethod.CUT_PARTIAL);
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to print receipt: " + e.getMessage(), e);
        }
    }

}