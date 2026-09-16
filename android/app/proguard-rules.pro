# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# --- ClutchD release rules ---

# Minification is currently DISABLED in build.gradle (release parity with debug).
# If you re-enable minifyEnabled, ALSO test on a device with these keep rules —
# R8 strips Capacitor's reflectively-registered plugin classes and breaks login.

# Keep Capacitor bridge + all plugins (registered reflectively via annotation).
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.CapacitorPlugin class * { *; }

# Keep Cordova plugin shim used by capacitor-cordova-android-plugins.
-keep class org.apache.cordova.** { *; }

# capacitor-firebase-authentication ships an optional Facebook provider whose SDK
# isn't bundled (the app only uses Google sign-in). R8 fails on the dangling refs.
-dontwarn com.facebook.**
