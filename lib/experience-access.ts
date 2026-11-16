import raw from './experience-access-data.json';
import type { Lang } from './i18n';

type Place = { en: string; ja: string };
export type AccessRoute = { place: Place; mode: 'walking' | 'transit' | 'driving'; minutes?: string; direct?: boolean; source?: string };
export type AccessProfile = { destination: Place | null; scope: 'area' | 'venue' | 'variable'; stations: AccessRoute[]; hotels: AccessRoute[]; nearby?: Place };
export const accessData = raw as { checkedAt: string; profiles: Record<string, AccessProfile>; experiences: Record<string, string> };
export function accessFor(slug: string): AccessProfile | undefined {
  const key = accessData.experiences[slug];
  return key ? accessData.profiles[key] : undefined;
}
export const placeName = (place: Place, lang: Lang) => lang === 'ja' ? place.ja : place.en;
export function directionsUrl(origin: Place, destination: Place, mode: AccessRoute['mode']) {
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', origin: origin.en, destination: destination.en, travelmode: mode })}`;
}

export const accessCopy = {
  en: {
    direct: 'Direct station connection', heading: 'Access from stations & hotels', stations: 'From major stations', hotels: 'From hotels', from: 'Starting point', route: 'Route & travel time', destination: 'Destination',
    area: 'Routes below end at the station or landmark shown, not the meeting point. Continue to the venue using the directions in your booking confirmation.',
    venue: 'Routes below lead to the teahouse. Follow your booking confirmation for the correct entrance.',
    variable: 'The venue is selected for your date. We confirm the meeting point and the route from your station or hotel after booking; a reliable door-to-door distance or travel time is not yet available.',
    pending: 'Route confirmed after booking', check: 'Check distance & time', walking: 'Walk', transit: 'Public transport', driving: 'Car / taxi route', about: 'Approx.', minutes: 'min',
    note: 'Times shown are approximate. Map routes show current distance and travel options; allow extra time for traffic, transfers and finding the entrance. Hotel names are departure examples, not a pickup or affiliation.',
    nearby: 'Combine your visit with', source: 'Access information', lastLeg: 'From the station to the venue',
  },
  ja: {
    direct: '駅直結', heading: '主要駅・ホテルからのアクセス', stations: '主要駅から', hotels: 'ホテルから', from: '出発地', route: '経路・所要時間', destination: '経路検索の目的地',
    area: '以下の経路は、表示の駅・目印までの案内です。集合場所とは異なります。駅・目印から会場までは予約確定メールの案内をご確認ください。',
    venue: '以下の経路は茶道会場までの案内です。入口の詳細は予約確定メールをご確認ください。',
    variable: '開催日に合わせて会場を決定します。駅・ホテルから集合場所までの経路は予約確定後にご案内するため、現時点では正確な距離・所要時間を掲載していません。',
    pending: '予約確定後に経路をご案内', check: '距離・所要時間を確認', walking: '徒歩', transit: '公共交通機関', driving: '車・タクシーの経路', about: '約', minutes: '分',
    note: '所要時間は目安です。地図で距離や移動手段をご確認いただき、渋滞・乗り換え・入口の確認に余裕を持ってお越しください。ホテル名は出発地の例であり、送迎や提携を示すものではありません。',
    nearby: 'あわせて楽しめる周辺エリア', source: 'アクセス案内', lastLeg: '駅から会場まで',
  },
  es: {
    direct: 'Conexión directa con la estación', heading: 'Cómo llegar desde estaciones y hoteles', stations: 'Desde las estaciones principales', hotels: 'Desde hoteles', from: 'Punto de partida', route: 'Ruta y duración', destination: 'Destino de la ruta',
    area: 'Las rutas terminan en la estación o el lugar indicado, no en el punto de encuentro. Para llegar al recinto, siga las instrucciones de la confirmación de su reserva.',
    venue: 'Las rutas llegan a la casa de té. Consulte la confirmación para encontrar la entrada correcta.',
    variable: 'El recinto se elige para la fecha de su visita. Tras la reserva confirmaremos el punto de encuentro y la ruta desde su estación u hotel; todavía no hay una distancia o duración fiable de puerta a puerta.',
    pending: 'Ruta tras confirmar la reserva', check: 'Consultar distancia y duración', walking: 'A pie', transit: 'Transporte público', driving: 'Ruta en coche / taxi', about: 'Aprox.', minutes: 'min',
    note: 'Los tiempos son orientativos. Consulte las distancias y opciones en el mapa y deje margen para el tráfico, los transbordos y la entrada. Los hoteles son ejemplos de salida; no indican recogida ni colaboración.',
    nearby: 'Combine su visita con', source: 'Información de acceso', lastLeg: 'De la estación al recinto',
  },
  fr: {
    direct: 'Accès direct à la gare', heading: 'Accès depuis les gares et les hôtels', stations: 'Depuis les principales gares', hotels: 'Depuis les hôtels', from: 'Point de départ', route: 'Itinéraire et durée', destination: 'Destination de l’itinéraire',
    area: 'Les itinéraires se terminent à la gare ou au repère indiqué, et non au point de rendez-vous. Suivez ensuite les indications de votre confirmation de réservation.',
    venue: 'Les itinéraires mènent à la maison de thé. Consultez votre confirmation pour trouver la bonne entrée.',
    variable: 'Le lieu est choisi pour votre date. Le point de rendez-vous et l’itinéraire depuis votre gare ou hôtel sont confirmés après réservation ; une distance et une durée fiables de porte à porte ne sont pas encore disponibles.',
    pending: 'Itinéraire confirmé après réservation', check: 'Voir la distance et la durée', walking: 'À pied', transit: 'Transports en commun', driving: 'Itinéraire en voiture / taxi', about: 'Env.', minutes: 'min',
    note: 'Les durées sont indicatives. La carte propose les distances et les moyens de transport ; prévoyez une marge pour la circulation, les correspondances et l’entrée. Les hôtels sont des exemples de départ, sans prise en charge ni partenariat implicite.',
    nearby: 'À découvrir dans le quartier', source: 'Informations d’accès', lastLeg: 'De la gare au lieu de l’activité',
  },
  'zh-tw': {
    direct: '直通車站', heading: '從主要車站及飯店前往', stations: '從主要車站出發', hotels: '從飯店出發', from: '出發地', route: '路線及所需時間', destination: '路線搜尋目的地',
    area: '以下路線只到所列車站或地標，並非集合地點。從車站或地標前往會場，請依照預訂確認信的指示。',
    venue: '以下路線前往茶道會場，詳細入口請查閱預訂確認信。',
    variable: '會場依參加日期安排。預訂確認後，我們會提供集合地點及從車站或飯店前往的路線，目前尚無法提供準確的全程距離及時間。',
    pending: '預訂確認後提供路線', check: '查看距離及所需時間', walking: '步行', transit: '大眾運輸', driving: '開車／計程車路線', about: '約', minutes: '分鐘',
    note: '所需時間僅供參考。請在地圖確認距離與交通方式，並預留塞車、轉乘及尋找入口的時間。飯店名稱為出發地範例，不代表接送或合作關係。',
    nearby: '可搭配遊覽的周邊地區', source: '交通資訊', lastLeg: '從車站到會場',
  },
} satisfies Record<Lang, Record<string, string>>;
