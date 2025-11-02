package com.vydray.pos;

import android.os.Bundle;
import android.os.Handler;
import android.webkit.WebView;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SiiPrinterPlugin.class);
        super.onCreate(savedInstanceState);

        // システムUIを正しく設定
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );

        // ステータスバーとナビゲーションバーを考慮したレイアウト
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );

        // Force WebView to render properly on initial load
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                    webView.requestLayout();
                    webView.invalidate();

                    // 強制的に再描画（さらに遅延を追加）
                    webView.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            webView.requestLayout();
                            webView.invalidate();
                        }
                    }, 300);
                }
            }
        }, 500);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Force layout refresh when app resumes
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.requestLayout();
            webView.invalidate();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // ウィンドウがフォーカスを取得したときにWebViewを再描画
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.requestLayout();
            }
        }
    }
}