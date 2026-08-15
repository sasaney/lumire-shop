# Lumire Shop — Scraper V4

## تغییرات Scraper V4
- پشتیبانی قوی‌تر از WooCommerce/WordPress.
- استخراج عنوان از JSON-LD، OpenGraph و H1.
- استخراج قیمت از JSON-LD، OpenGraph و سلکتورهای WooCommerce.
- تشخیص موجودی از Schema، meta و متن‌های رایج WooCommerce.
- استخراج گالری کامل محصول، نه فقط عکس اصلی.
- پشتیبانی از `srcset`, `data-src`, `data-large_image` و URLهای نسبی.
- استخراج توضیحات کوتاه و توضیحات کامل WooCommerce.
- نگهداری نسخه HTML پاک‌سازی‌شده توضیحات برای نمایش عکس‌های داخل متن.
- حذف script/style/iframe/form و event handlerها از HTML واردشده.
- افزایش timeout اسکرپر به ۱۵ ثانیه و ارسال headerهای واقعی‌تر مرورگر.
- در اجرای خودکار، عنوان/توضیحات/HTML توضیحات/گالری نیز در صورت وجود مقدار جدید همگام می‌شوند.
- گالری به حداکثر ۲۰ تصویر محدود شده است.
- صفحه محصول گالری تصاویر را نمایش می‌دهد و تصاویر خارجی را بدون نیاز به whitelist دامنه از طریق Next Image استفاده می‌کند.

## تست نمونه
URL موردنظر:
https://unique-diamond.ir/product/creed-aventus-eau-de-parfum-for-men-100ml/

در این صفحه ساختار WooCommerce شامل عنوان، توضیح کوتاه/کامل و بخش گالری است؛ بنابراین نسخه جدید علاوه بر JSON-LD، مستقیماً این ساختارها را هم بررسی می‌کند.
