// Copy for the standing pages (About, FAQ). Kept apart from the catalog because
// it changes on its own rhythm — and because every locale needs the same shape.

import type { Lang } from "@/lib/i18n";

export interface Faq { q: string; a: string }

export interface AboutCopy {
  title: string;
  metaDescription: string;
  lead: string;
  sections: { heading: string; body: string[] }[];
  promises: { heading: string; body: string }[];
  closing: { heading: string; body: string; cta: string };
}

export interface FaqCopy {
  title: string;
  metaDescription: string;
  lead: string;
  groups: { heading: string; items: Faq[] }[];
  closing: { heading: string; body: string; cta: string };
}

const ABOUT: Record<Lang, AboutCopy> = {
  en: {
    title: "Our approach",
    metaDescription:
      "Why KAMEHAME JAPAN books small, private cultural experiences with working masters in Tokyo and Kyoto — and how an interpreter guide changes what you take home.",
    lead:
      "Most cultural experiences sold to visitors in Japan are built for volume. Ours are built around the person teaching them.",
    sections: [
      {
        heading: "Why we started",
        body: [
          "Japan is generous with its surfaces and careful with its interiors. You can stand in front of a sumo stable at six in the morning, or walk past a teahouse in Gion every evening for a week, and never get past the doorway. Not because anyone is unfriendly — because there is no obvious way in.",
          "The way in has always been introduction. A name, passed from someone trusted to someone else. That is how the karyukai has worked for three centuries, and how most craft traditions still work today. What we do is spend the time to build those introductions, then hold them open for people who have three days in Tokyo and no way of knowing where to knock.",
        ],
      },
      {
        heading: "Small on purpose",
        body: [
          "Every experience we sell is private or close to it. That is not a luxury flourish — it is the condition that makes the rest possible. A master teaching two people can answer the question you actually have. A master teaching twenty is running a performance.",
          "It also means we sell fewer sessions than we could. A sushi counter has one chef and a finite number of evenings. We would rather show you a date that is genuinely available than a calendar that is always green.",
        ],
      },
      {
        heading: "The interpreter is the experience",
        body: [
          "An interpreter guide comes with every booking, and we think of that as the product rather than an add-on. Watching someone shape rice in silence is pleasant. Asking why the rice is at body temperature, hearing the answer, and then asking the follow-up — that is the thing you will still be describing to people a year later.",
          "Our guides are briefed on the craft, not just the language. They know when to translate and when to stay out of the way.",
        ],
      },
    ],
    promises: [
      {
        heading: "Real practitioners",
        body: "Everyone you meet works in the craft. No actors, no demonstration-only venues built for tour groups.",
      },
      {
        heading: "Honest availability",
        body: "If a date is not open, we say so. Some of our experiences are confirmed with the house before your booking is final, and we tell you that up front.",
      },
      {
        heading: "Prices that hold",
        body: "The price you see includes the interpreter guide and the session itself. Anything not included is written on the page, not discovered on the day.",
      },
      {
        heading: "Privacy for our partners",
        body: "Some houses ask that their name and address stay private until a booking is confirmed. We honour that — it is often the reason they are willing to receive guests at all.",
      },
    ],
    closing: {
      heading: "Start with one afternoon",
      body:
        "You do not need to plan a whole trip around this. One session, two hours, and the rest of your itinerary stays exactly as it was.",
      cta: "See all experiences",
    },
  },
  es: {
    title: "Nuestra filosofía",
    metaDescription:
      "Por qué KAMEHAME JAPAN reserva experiencias culturales privadas con maestros en activo de Tokio y Kioto, y qué cambia cuando te acompaña un guía intérprete.",
    lead:
      "Casi todas las experiencias culturales que se venden a los visitantes en Japón están pensadas para el volumen. Las nuestras se construyen alrededor de quien las enseña.",
    sections: [
      {
        heading: "Por qué empezamos",
        body: [
          "Japón es generoso con sus superficies y cuidadoso con sus interiores. Puedes plantarte ante un establo de sumo a las seis de la mañana, o pasar por delante de una casa de té de Gion cada tarde durante una semana, y no cruzar nunca el umbral. No por falta de amabilidad, sino porque no hay una puerta evidente.",
          "La puerta siempre ha sido la presentación personal: un nombre que pasa de alguien de confianza a otra persona. Así funciona el karyukai desde hace tres siglos y así siguen funcionando la mayoría de los oficios tradicionales. Nosotros dedicamos el tiempo a construir esas presentaciones y las mantenemos abiertas para quien tiene tres días en Tokio y ninguna forma de saber a qué puerta llamar.",
        ],
      },
      {
        heading: "Pequeño a propósito",
        body: [
          "Todas las experiencias que vendemos son privadas o casi. No es un adorno de lujo: es la condición que hace posible todo lo demás. Un maestro que enseña a dos personas puede responder a la pregunta que de verdad tienes. Un maestro que enseña a veinte está dando una función.",
          "También significa que vendemos menos sesiones de las que podríamos. Una barra de sushi tiene un chef y un número finito de noches. Preferimos enseñarte una fecha realmente disponible antes que un calendario siempre en verde.",
        ],
      },
      {
        heading: "El intérprete es la experiencia",
        body: [
          "Cada reserva incluye un guía intérprete, y lo consideramos el producto, no un extra. Ver a alguien moldear arroz en silencio resulta agradable. Preguntar por qué el arroz está a temperatura corporal, escuchar la respuesta y poder repreguntar: eso es lo que seguirás contando un año después.",
          "Nuestros guías conocen el oficio, no solo el idioma. Saben cuándo traducir y cuándo apartarse.",
        ],
      },
    ],
    promises: [
      {
        heading: "Profesionales de verdad",
        body: "Todas las personas que conocerás trabajan en el oficio. Sin actores ni locales de demostración montados para grupos.",
      },
      {
        heading: "Disponibilidad honesta",
        body: "Si una fecha no está libre, te lo decimos. Algunas experiencias se confirman con la casa antes de cerrar la reserva, y lo indicamos desde el principio.",
      },
      {
        heading: "Precios que se sostienen",
        body: "El precio que ves incluye el guía intérprete y la sesión. Lo que no está incluido aparece escrito en la página, no se descubre el mismo día.",
      },
      {
        heading: "Privacidad para nuestros socios",
        body: "Algunas casas piden que su nombre y dirección se mantengan privados hasta confirmar la reserva. Lo respetamos: a menudo es la razón por la que aceptan recibir visitantes.",
      },
    ],
    closing: {
      heading: "Empieza por una tarde",
      body:
        "No hace falta planificar el viaje entero alrededor de esto. Una sesión, dos horas, y el resto de tu itinerario sigue igual.",
      cta: "Ver todas las experiencias",
    },
  },
};

const FAQ: Record<Lang, FaqCopy> = {
  en: {
    title: "Frequently asked questions",
    metaDescription:
      "Booking, language, timing, dress, dietary needs and cancellation — the questions visitors ask before booking a cultural experience in Tokyo or Kyoto.",
    lead: "If your question is not here, write to us. A person answers, usually the same day.",
    groups: [
      {
        heading: "Booking",
        items: [
          {
            q: "How far in advance should I book?",
            a: "Two to four weeks is comfortable for most experiences. The Kyoto maiko and geiko banquet needs at least three days and fills quickly in spring and autumn. If your dates are close, ask anyway — cancellations happen.",
          },
          {
            q: "What does “on request” mean on some experiences?",
            a: "It means the house confirms your date before the booking is final. You send your preferred date and party size, we check with them, and you hear back within 24 hours. Nothing is settled until we confirm, and we will tell you straight away if the date cannot be held.",
          },
          {
            q: "Can I book for one person?",
            a: "Some experiences have a two-person minimum because the session is priced per group. The minimum is written on each experience page under the group size.",
          },
          {
            q: "Do you arrange transport or hotel pickup?",
            a: "No. Every experience is meet-on-site: you make your own way there and leave when it ends. We send clear directions, the nearest station and walking time once your booking is confirmed.",
          },
        ],
      },
      {
        heading: "On the day",
        items: [
          {
            q: "Will someone speak my language?",
            a: "Yes. An interpreter guide is included in every booking and stays with you throughout. The master usually teaches in Japanese; your guide carries the conversation both ways, including your questions.",
          },
          {
            q: "Where exactly do we meet?",
            a: "The meeting point is confirmed by email once your booking is final. Some of our partner venues ask that their name and address stay private until then, so the experience page gives the district and nearest station rather than the street address.",
          },
          {
            q: "What should I wear?",
            a: "Comfortable clothes you can move in. Several venues are tatami rooms where you will take your shoes off, so socks without holes are a genuine kindness to yourself. Anything more specific is listed on the experience page.",
          },
          {
            q: "Can I take photographs?",
            a: "Almost always yes, and in most sessions there is a moment set aside for it. A few venues restrict photography during parts of the session; your guide will tell you when.",
          },
        ],
      },
      {
        heading: "Who can join",
        items: [
          {
            q: "Are children welcome?",
            a: "It depends on the experience — the age range is written on each page. Where children can join, the price is often lower for them.",
          },
          {
            q: "I have tattoos. Is that a problem?",
            a: "For our experiences, generally no. If a particular venue asks for tattoos to be covered, it is stated on that experience page. Japan's rules about tattoos mostly concern bathhouses and pools, which we do not book.",
          },
          {
            q: "Can you accommodate dietary requirements?",
            a: "Where food is served, yes, with notice. Tell us when you book — allergies, vegetarian, vegan, halal — and we will confirm what the kitchen can do before you pay.",
          },
          {
            q: "What about accessibility?",
            a: "Several venues are older buildings with steps and no lift. Tell us what you need and we will check the specific venue rather than guess; if it will not work we will say so.",
          },
        ],
      },
      {
        heading: "Payment and changes",
        items: [
          {
            q: "What currency do I pay in?",
            a: "Prices are set and charged in Japanese yen. Your card issuer converts at its own rate, so the amount in your currency may differ slightly from any estimate shown.",
          },
          {
            q: "What is included in the price?",
            a: "The session itself and your interpreter guide. Anything not included — a souvenir you keep, an extra performer, shipping a piece home — is listed on the experience page before you book.",
          },
          {
            q: "Can I cancel or change my date?",
            a: "Cancellation terms are printed on every experience page, because they differ by venue. Some are free up to seven days before; others charge from four days out. Read the terms on the page you are booking.",
          },
          {
            q: "What if the venue cancels?",
            a: "You receive a full refund. Where we can offer an alternative date first, we will.",
          },
        ],
      },
    ],
    closing: {
      heading: "Still deciding?",
      body: "Tell us the dates you are in Japan and what interests you, and we will say honestly what is worth your afternoon.",
      cta: "Browse experiences",
    },
  },
  es: {
    title: "Preguntas frecuentes",
    metaDescription:
      "Reservas, idioma, horarios, vestimenta, dietas y cancelaciones: lo que preguntan los viajeros antes de reservar una experiencia cultural en Tokio o Kioto.",
    lead: "Si tu pregunta no está aquí, escríbenos. Responde una persona, normalmente el mismo día.",
    groups: [
      {
        heading: "Reservas",
        items: [
          {
            q: "¿Con cuánta antelación conviene reservar?",
            a: "Entre dos y cuatro semanas va bien para casi todo. El banquete con maiko y geiko en Kioto necesita al menos tres días y se llena rápido en primavera y otoño. Si tus fechas están cerca, pregúntanos igualmente: siempre hay cancelaciones.",
          },
          {
            q: "¿Qué significa «bajo petición» en algunas experiencias?",
            a: "Significa que la casa confirma tu fecha antes de cerrar la reserva. Nos envías la fecha y el número de personas, lo consultamos con ellos y te respondemos en 24 horas. Nada queda cerrado hasta que lo confirmamos, y si la fecha no puede mantenerse te lo decimos enseguida.",
          },
          {
            q: "¿Puedo reservar para una sola persona?",
            a: "Algunas experiencias tienen un mínimo de dos personas porque el precio es por grupo. El mínimo aparece en cada página, junto al tamaño del grupo.",
          },
          {
            q: "¿Organizáis transporte o recogida en el hotel?",
            a: "No. Todas las experiencias son con punto de encuentro en el lugar: llegas por tu cuenta y te marchas al terminar. Te enviamos indicaciones claras, la estación más cercana y el tiempo a pie en cuanto se confirma la reserva.",
          },
        ],
      },
      {
        heading: "El día de la experiencia",
        items: [
          {
            q: "¿Habrá alguien que hable mi idioma?",
            a: "Sí. Todas las reservas incluyen un guía intérprete que te acompaña en todo momento. El maestro suele enseñar en japonés; tu guía lleva la conversación en ambas direcciones, también tus preguntas.",
          },
          {
            q: "¿Dónde nos encontramos exactamente?",
            a: "El punto de encuentro se confirma por correo cuando la reserva queda cerrada. Algunos de nuestros locales piden que su nombre y dirección se mantengan privados hasta entonces, así que la página indica el barrio y la estación más cercana en lugar de la calle.",
          },
          {
            q: "¿Cómo debo vestir?",
            a: "Ropa cómoda con la que puedas moverte. Varios locales son salas de tatami donde te descalzarás, así que unos calcetines sin agujeros son un favor que te haces a ti. Cualquier requisito concreto aparece en la página de la experiencia.",
          },
          {
            q: "¿Puedo hacer fotos?",
            a: "Casi siempre sí, y en la mayoría de las sesiones hay un momento reservado para ello. Algunos locales restringen las fotos en ciertas partes; tu guía te avisará.",
          },
        ],
      },
      {
        heading: "Quién puede participar",
        items: [
          {
            q: "¿Pueden venir niños?",
            a: "Depende de la experiencia: el rango de edad está indicado en cada página. Donde pueden participar, su precio suele ser menor.",
          },
          {
            q: "Tengo tatuajes. ¿Es un problema?",
            a: "En nuestras experiencias, por lo general no. Si algún local pide cubrirlos, se indica en esa página. Las normas japonesas sobre tatuajes afectan sobre todo a baños y piscinas, que no reservamos.",
          },
          {
            q: "¿Podéis atender necesidades dietéticas?",
            a: "Donde se sirve comida, sí, avisando con antelación. Dínoslo al reservar —alergias, vegetariano, vegano, halal— y confirmaremos qué puede hacer la cocina antes de que pagues.",
          },
          {
            q: "¿Y la accesibilidad?",
            a: "Varios locales son edificios antiguos con escalones y sin ascensor. Cuéntanos qué necesitas y lo comprobamos con ese local concreto en lugar de suponerlo; si no es viable, te lo diremos.",
          },
        ],
      },
      {
        heading: "Pago y cambios",
        items: [
          {
            q: "¿En qué moneda pago?",
            a: "Los precios se fijan y se cobran en yenes japoneses. Tu banco aplica su propio cambio, así que el importe en tu moneda puede variar ligeramente respecto a cualquier estimación mostrada.",
          },
          {
            q: "¿Qué incluye el precio?",
            a: "La sesión y tu guía intérprete. Lo que no se incluye —un recuerdo que te llevas, un artista adicional, el envío de una pieza a casa— aparece en la página antes de reservar.",
          },
          {
            q: "¿Puedo cancelar o cambiar la fecha?",
            a: "Las condiciones de cancelación están impresas en cada página, porque varían según el local. Algunas son gratuitas hasta siete días antes; otras cobran desde cuatro días antes. Lee las condiciones de la página que estés reservando.",
          },
          {
            q: "¿Y si cancela el local?",
            a: "Recibes el reembolso íntegro. Si podemos ofrecerte antes una fecha alternativa, lo haremos.",
          },
        ],
      },
    ],
    closing: {
      heading: "¿Aún lo estás pensando?",
      body: "Dinos qué días estarás en Japón y qué te interesa, y te diremos con franqueza qué merece tu tarde.",
      cta: "Ver experiencias",
    },
  },
};

export const aboutFor = (lang: Lang) => ABOUT[lang];
export const faqFor = (lang: Lang) => FAQ[lang];
