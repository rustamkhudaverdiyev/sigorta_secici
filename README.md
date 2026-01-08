# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

⚡ 0.4 kV Sigorta / Şalter Seçici

0.4 kV Sigorta / Şalter Seçici, aşağı gərginlik elektrik sistemlərində yüklərə uyğun qoruma aparatının (MCB / MCCB / ACB) ilkin seçimi üçün hazırlanmış veb əsaslı mühəndislik alətidir.

Alət, yükə əsasən hesablanan cərəyana (Ib) görə standart In dəyərləri arasından uyğun qoruma aparatını tövsiyə edir.

🎯 Məqsəd

Bu alətin əsas məqsədi:

0.4 kV sistemlərdə qoruma aparatının sürətli ilkin seçimi

Layihə və sahə mərhələsində vaxt itkisini azaltmaq

Manual hesab və səhv seçimin qarşısını almaqdır

Bu alət son layihə qərarı üçün deyil, mühəndisə ilk filtr və yönləndirmə vermək üçün nəzərdə tutulmuşdur.

⚙️ İş prinsipi

Hesablama aşağıdakı ardıcıllıqla aparılır:

Yük dəyəri (kW və ya alternativ girişlər)

Faz sayı və sistem gərginliyi

cosφ, η (effektivlik), Kd və margin əmsalları

Hesablanan cərəyan (Ib)

Standart In siyahısından yuxarı yuvarlaq seçim

Cərəyan səviyyəsinə görə MCB / MCCB / ACB tövsiyəsi

MCB üçün uyğun eğri (B / C / D) barədə fikir

🧮 Giriş parametrləri
Əsas parametrlər

Faz (məsələn: 1 faz – 230 V)

Giriş modu (kW və s.)

Yük dəyəri

Məkan / ssenaryo (məsələn: bina giriş panosu)

Əmsallar

cosφ – güc əmsalı

η (eta) – effektivlik

Kd – müxtəliflik (diversity) əmsalı

Margin – ehtiyat payı

Kd və margin boş buraxıldıqda ssenari üzrə default dəyərlər tətbiq edilir.

📊 Çıxış nəticələri

Hesablamadan sonra sistem aşağıdakı məlumatları təqdim edir:

Hesablanan cərəyan (Ib)

Tövsiyə olunan standart In

Qoruma aparatı tipi (MCB / MCCB / ACB)

MCB eğrisi üçün fikir (B / C / D)

İstifadə olunan varsayımlar

🧾 Standart In dəyərləri

Alət aşağıdakı standart nominal cərəyan dəyərlərini əsas götürür:

6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100,
125, 160, 200, 250, 315, 400, 500, 630,
800, 1000, 1250, 1600, 2000, 2500, 3200

🖥️ Texniki xüsusiyyətlər

Tamamilə frontend əsaslı

Backend və server tələb etmir

GitHub Pages üzərindən işləyir

Yüngül, sürətli və asan istifadə edilən interfeys

İstifadə olunan texnologiyalar:

HTML

CSS

JavaScript

⚠️ Məhdudiyyətlər və qeydlər

Selektivlik analizi aparılmır

Qısaqapanma cərəyanı hesablanmır

Kabel kəsiti və termik yoxlamalar daxil deyil

Ortam temperaturu və döşəmə şəraiti nəzərə alınmır

Bu səbəbdən:

Real layihələrdə mütləq mühəndis yoxlaması və normativ uyğunluq təmin edilməlidir.

📌 Versiya qeydi

V1

Aktiv gücə əsaslanan hesab

MCB / MCCB / ACB ilkin bölgüsü

Manual override imkanları

Gələcək versiyalar üçün planlananlar:

3 fazalı geniş ssenarilər

Qısaqapanma səviyyəsinə görə seçim

Selektivlik yoxlaması

Kabel kəsiti ilə inteqrasiya

👷‍♂️ Müəllif

Yapımcı: Rustam Khudaverdiyev
Bu alət praktik sahə ehtiyacları nəzərə alınaraq hazırlanmışdır.
