# Advanced Events Spec

## Event Graph
Events can have nested choices with conditions and follow-ups.

Schema (per event):
{
  "id": "river-rumor",
  "weight": 3,
  "conditions": { "mileMin":0, "mileMax":2300, "season":["spring","summer"], "requiresStatus":["none"] },
  "intro": "A trapper warns about a dangerous crossing ahead.",
  "stages": [
    {
      "text": "Do you take his advice?",
      "choices": [
        { "id":"heed", "text":"Heed his advice", "effects":[{"type":"mapFlag","key":"avoidNextRiver","value":true}], "next":"thanks" },
        { "id":"ignore", "text":"Ignore", "effects":[{"type":"morale","delta":-2}], "next":"uh_oh" }
      ]
    },
    { "id":"thanks", "text":"You chart a longer but safer path.", "effects":[{"type":"distance","delta":-10},{"type":"time","days":+1}] },
    { "id":"uh_oh", "text":"The river looks worse than expected.", "followupRoll":[
      {"chance":0.7, "effects":[{"type":"riskBuff","riverAccidentChance":"+10%"}], "textOnRoll":"Noted, but you press on."},
      {"chance":0.3, "effects":[{"type":"instantRiverAccident":true}], "textOnRoll":"A sudden squall hits."}
    ]}
  ]
}

## Effect Types (engine supports)
resource, health, status add/remove, time, distance, inventory, money, morale, mapFlag, riskBuff, mortality(memberId|random).

## Unique Family Deaths (tasteful but distinct)
- Per-member epitaph text keys: "death_merri_ellen_pneumonia", "death_mike_exhaustion", "death_ros_snakebite", "death_jess_river", "death_martha_illness", "death_rusty_fever"
- Engine rule: if a mortality effect targets a specific memberId, pick the matching epitaph; else choose generic.
- **Content rating toggle**: `settings.contentTone` = "classic" (grim) | "light" (less graphic text).
