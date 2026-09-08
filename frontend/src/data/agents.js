// وسطاء تجريبيون (Static Demo) يُعرضون عند تعذّر الاتصال بالـ backend.
// مصدر مشترك بين صفحة الوسطاء (Agents) وصفحة تفاصيل الوسيط (AgentDetails)
// حتى يظهر نفس الوسيط في الصفحتين عندما يكون API غير متاح.
export const FALLBACK_AGENTS = [
  {
    id: 1,
    first_name: "أحمد",
    last_name: "علي",
    phone: "01000000000",
    bio: "مستشار عقاري أول متخصص في القاهرة الجديدة والتجمع الخامس.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
  {
    id: 2,
    first_name: "منى",
    last_name: "السيد",
    phone: "01011112222",
    bio: "مستشارة عقارية متخصصة في الشيخ زايد وأكتوبر.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
  {
    id: 3,
    first_name: "كريم",
    last_name: "فتحي",
    phone: "01023334444",
    bio: "مستشار استثمار عقاري متخصص في الساحل الشمالي.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
  {
    id: 4,
    first_name: "هبة",
    last_name: "عبد الرحمن",
    phone: "01035556666",
    bio: "مستشارة عقارية متخصصة في الإسكندرية.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
];

export default FALLBACK_AGENTS;