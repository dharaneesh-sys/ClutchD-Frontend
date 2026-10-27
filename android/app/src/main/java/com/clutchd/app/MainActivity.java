package com.clutchd.app;

import android.os.Bundle;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate so the launch theme hands off to
        // postSplashScreenTheme without a white frame.
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
