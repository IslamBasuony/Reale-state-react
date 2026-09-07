import React, { useState, useEffect, useRef } from "react";
import "./ClientsSection.css";

const ClientsSection = () => {
  const testimonials = [
    [
      {
        name: "محمد أحمد - الجيزة",
        text:" بصراحة الموقع ممتاز جدًا! قدرت ألاقي شقة للإيجار في المعادي في يومين بس، والتواصل مع المالك كان سهل جدًا. بحب فكرة إن الصور حقيقية والأسعار واضحة من غير لف ودوران. أنصح أي حد يدور على شقة يستخدم الموقع ده.",
      },
      {
        name: "سارة محمد - الإسكندرية",
        text: "التجربة كانت كويسة جدًا بسبب بساطة الموقع وسهولة التعامل عليه. قدروا يساعدوني بسرعة في اختيار العقار المناسب.",
      },
      {
        name: "أحمد خالد - القاهرة",
        text: "خدمة الموقع ممتازة جدًا! فريق الدعم ساعدني أختار العقار المناسب بسرعة كبيرة. أكيد هرجع أتعامل معاهم تاني.",
      },
    ],
    [
      {
        name: "نورا إبراهيم - المنصورة",
        text: "أكثر ما أعجبني هو الشفافية والدقة في عرض التفاصيل. تجربة مميزة جدًا وأنصح الجميع بها.",
      },
      {
        name: "علي حسن - طنطا",
                text:" بصراحة الموقع ممتاز جدًا! قدرت ألاقي شقة للإيجار في المعادي في يومين بس، والتواصل مع المالك كان سهل جدًا. بحب فكرة إن الصور حقيقية والأسعار واضحة من غير لف ودوران. أنصح أي حد يدور على شقة يستخدم الموقع ده.",

      },
      {
        name: "مي يوسف - أسيوط",
        text: "من أفضل مواقع العقارات اللي استخدمتها. سريع وسهل جدًا والتجربة ممتازة من البداية للنهاية.",
      },
    ],
    [
      {
        name: "ياسمين فؤاد - بورسعيد",
        text: "موقع أكثر من رائع وسهل جدًا في الاستخدام، ساعدني أختار عقار مناسب في وقت قصير جدًا.",
      },
      {
        name: "إسلام عبد الله - المنيا",
        text: "خدمة ممتازة ودعم متعاون، شكراً لكم على المصداقية والاهتمام بتفاصيل العملاء.",
      },
      {
        name: "محمود علي - السويس",
        text: "أكثر حاجة عجبتني السرعة في الرد والمرونة في التواصل، تجربة مميزة فعلاً.",
      },
    ],
  ];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutsRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    // reset tracked timers for this effect
    timeoutsRef.current = [];
    intervalRef.current = setInterval(() => {
      setFade(false);
      const t = setTimeout(() => {
        setIndex((prev) => (prev + 1) % testimonials.length);
        setFade(true);
      }, 500);
      timeoutsRef.current.push(t);
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutsRef.current.forEach((to) => clearTimeout(to));
      timeoutsRef.current = [];
    };
  }, [testimonials.length]);

  const handleDotClick = (i) => {
    setFade(false);
    const t = setTimeout(() => {
      setIndex(i);
      setFade(true);
    }, 300);
    timeoutsRef.current.push(t);
  };

  return (
    <section className="clients-section">
      <h2 className="section-title">آراء عملائنا</h2>

      <div className={`testimonials-container ${fade ? "fade-in" : "fade-out"}`}>
        {testimonials[index].map((item, i) => (
          <div
            key={i}
            className={`testimonial-card ${i === 0 ? "active" : ""}`}
          >
            <div className="quote">“</div>
            <p className="testimonial-text">{item.text}</p>
            <p className="testimonial-author">{item.name}</p>
          </div>
        ))}
      </div>

      <div className="dots">
        {testimonials.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === index ? "active" : ""}`}
            onClick={() => handleDotClick(i)}
          />
        ))}
      </div>
    </section>
  );
};

export default ClientsSection;
