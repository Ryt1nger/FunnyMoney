package com.funnymoney.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Настоящий edge-to-edge: WebView рисуется на весь экран, под системными
    // панелями, а не просто ужимается под их отступы — панели становятся
    // прозрачными и накладываются поверх контента, а не занимают своё место.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    getWindow().setStatusBarColor(Color.TRANSPARENT);
    getWindow().setNavigationBarColor(Color.TRANSPARENT);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      // На Android 10+ система по умолчанию подкладывает под жестовую панель
      // затемняющую подложку для контраста — она-то и выглядит как "серая
      // полоса" поверх приложения. Отключаем, раз панель и так прозрачная.
      getWindow().setNavigationBarContrastEnforced(false);
    }

    WindowInsetsControllerCompat controller =
        new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
    // Верх приложения почти везде тёмный/цветной фон — белые иконки статус-бара
    // читаются на нём лучше, чем тёмные.
    controller.setAppearanceLightStatusBars(false);
    // Низ — кремовая нижняя навигация приложения, поэтому системные значки
    // жестовой панели делаем тёмными, чтобы не терялись на светлом фоне.
    controller.setAppearanceLightNavigationBars(true);
  }
}
