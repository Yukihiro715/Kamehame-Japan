"use client";
import { useState } from "react";
import { Card, Field } from "../ui";
import { yen } from "../client";

export function CommissionPlan({ annualGross }: { annualGross: number }) {
  const [tiers, setTiers] = useState([
    { name: "スタンダード", threshold: 0, rate: 5 },
    { name: "シルバー", threshold: 2500000, rate: 6 },
    { name: "ゴールド", threshold: 15000000, rate: 7 },
    { name: "プラチナ", threshold: 35000000, rate: 8 },
  ]);
  const [base, setBase] = useState(10000);
  const valid = tiers.every(
    (v, i) =>
      Number.isSafeInteger(v.threshold) &&
      v.threshold >= 0 &&
      Number.isFinite(v.rate) &&
      v.rate >= 0 &&
      v.rate <= 100 &&
      (!i ||
        (v.threshold > tiers[i - 1].threshold && v.rate >= tiers[i - 1].rate)),
  );
  const current = tiers.filter((v) => v.threshold <= annualGross).at(-1);
  const next = tiers.find((v) => v.threshold > annualGross);
  function edit(i: number, field: "threshold" | "rate", value: number) {
    setTiers((t) => t.map((v, j) => (j === i ? { ...v, [field]: value } : v)));
  }
  return (
    <Card title="年間予約総額によるコミッション試算">
      <p>
        この拠点の今年の決済済み紹介予約総額は {yen(annualGross)}{" "}
        です。予約受付日を基準に、返金分・現地払い・卸販売を除いて集計します。
      </p>
      <p>以下は検討用の仮条件です。入力はこの画面内の試算にのみ使用します。</p>
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th>ランク</th>
              <th>年間予約総額（円）</th>
              <th>コミッション率（%）</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((v, i) => (
              <tr key={v.name}>
                <td>{v.name}</td>
                <td>
                  <input
                    aria-label={v.name + "の達成金額"}
                    disabled={!i}
                    type="number"
                    min="0"
                    value={isNaN(v.threshold) ? "" : v.threshold}
                    onChange={(e) =>
                      edit(i, "threshold", e.target.valueAsNumber)
                    }
                  />
                </td>
                <td>
                  <input
                    aria-label={v.name + "の料率"}
                    type="number"
                    min="0"
                    max="100"
                    step=".1"
                    value={isNaN(v.rate) ? "" : v.rate}
                    onChange={(e) => edit(i, "rate", e.target.valueAsNumber)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Field label="1予約あたりのコミッション対象額（税抜・円）">
        <input
          type="number"
          min="0"
          value={isNaN(base) ? "" : base}
          onChange={(e) => setBase(e.target.valueAsNumber)}
        />
      </Field>
      <p role="status">
        {valid && current && Number.isSafeInteger(base) && base >= 0
          ? `現在の仮ランクは${current.name}（${current.rate}%）。この予約の試算額は${yen(Math.round((base * current.rate) / 100))}です。${next ? `次のランクまで${yen(next.threshold - annualGross)}です。` : ""}`
          : "達成金額は昇順、料率は前ランク以上の0〜100%、対象額は0円以上で入力してください。"}
      </p>
    </Card>
  );
}
