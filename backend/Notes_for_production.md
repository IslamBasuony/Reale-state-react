TODO 1 stop dropping the data base every time you start the server.

TODO 2 change the .env file to only have the required data for production.

### If you wanted to track empty new sessions and collect data from those empty sessions set "saveUninitialized: true" in the object passed to the session function

const fallbackData = {
id: 1,
title: "مكتب فاخر للبيع في القاهرة الجديدة",
type: "مكتب تجاري",
status: "للبيع",
area_size: 180,
bedrooms_number: 3,
bathrooms_number: 2,
floor: "الثالث",
finishing: "كامل - سوبر لوكس",
added_date: "15 أكتوبر 2025",
price: 1700000,
location: {
name: "وسط البلد",
city: "القاهرة",
latitude: 30.044406,
longitude: 31.235712,
description: "قلب القاهرة النابض، يشتهر بالمتاحف والمكتبات والمقاهي التاريخية والعمارة الإسلامية الرائعة والحياة الثقافية الغنية."
},
description:
"شقة مميزة بتصميم عصري داخل كمبوند متكامل الخدمات، تتكون من 3 غرف نوم، 2 حمام، ومطبخ مفتوح على الريسبشن. تتميز بإطلالة على المساحات الخضراء وواجهة بحرية تسمح بدخول الضوء الطبيعي طوال اليوم.",
images: [
"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
],
contact: {
phone: "01012345678",
Whatsapp: "+0212156512",
email: "mostafa@example.com",
},
features: [
"نادي اجتماعي",
"منطقة أطفال",
"حراسة 24 ساعة",
"مطاعم وكافيهات",
"حمام سباحة",
"جراج خاص",
],
};
دا شكل الداتا اللي محتاجها من عندك لصفحه الdetals علي حسب التصميم اللي عندي في الصفحه 🙂
