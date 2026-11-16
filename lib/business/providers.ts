/** Operations-only provider labels. Supplier details are not added to public experience pages. */
const providers:Record<string,string>={
  "mt-fuji-golf-day": "KAMEHAME JAPAN（株式会社プロセント）／各ゴルフ場・個別手配",
  "nerima-herbal-bath-private-spa": "貸切温泉ホームスパ 石神癒（ガムナミエス合同会社）",
  "kyoto-ryokan-beauty-clinic": "若冲庵美容クリニック（法人名未確認）",
  "kanji-name-calligraphy": "未確認（東京の筆文字講師）",
  "shibuya-ramen-class": "Viyago Japan（Cresc.）",
  "dotonbori-ramen-class": "Viyago Japan（Cresc.）",
  "nihonbashi-kendo-experience": "株式会社Kendo Spirit",
  "nihonbashi-bushido-experience": "株式会社Kendo Spirit",
  "yotsuya-tea-ceremony": "茶の湯ヒーリング協会",
  "tokyo-kendo-experience-tour": "SAMURAI TRIP（株式会社パークフォーアス）",
  "osaka-kendo-experience-tour": "SAMURAI TRIP（株式会社パークフォーアス）",
  "kyoto-kendo-experience-tour": "SAMURAI TRIP（株式会社パークフォーアス）",
  "nagoya-kendo-experience-tour": "SAMURAI TRIP（株式会社パークフォーアス）",
  "okinawa-kendo-experience-tour": "SAMURAI TRIP（株式会社パークフォーアス）",
  "kanazawa-kendo-experience-tour": "SAMURAI TRIP（株式会社パークフォーアス）",
  "himeji-kendo-experience-tour": "SAMURAI TRIP（株式会社パークフォーアス）",
  "nihonbashi-japanese-dance-salon": "Amazing Japan Lounge（綾音事務所）",
  "nihonbashi-english-rakugo-salon": "Amazing Japan Lounge（綾音事務所）",
  "nihonbashi-shamisen-salon": "Amazing Japan Lounge（綾音事務所）",
  "kyoto-garden-teahouse-tea-ceremony": "Camellia Tea Ceremony",
  "kyoto-higashiyama-shared-tea-ceremony": "Camellia Tea Ceremony",
  "kyoto-higashiyama-private-tea-ceremony": "Camellia Tea Ceremony",
  "kyoto-higashiyama-annex-tea-ceremony": "Camellia Tea Ceremony",
  "evening-with-geiko": "未確認（京都の芸妓・舞妓ディナー手配先）"
};
export const productProvider=(slug:string)=>providers[slug]??"未確認";
