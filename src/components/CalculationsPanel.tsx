'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ConfigRow {
  key: string;
  value: number;
  unit: string | null;
  description: string | null;
}

const ASSUMPTIONS: { title: string; body: string }[] = [
  {
    title: 'Verticale opstelling (paneelhoek = 90°)',
    body: 'Alle PVGIS-aanvragen sturen angle=90 mee, ongeacht het werkelijke product. Als de panelen op een SPIRIT zonnemast schuin staan, klopt deze waarde niet en wordt de opbrengst onderschat (zomer) of overschat (winter).',
  },
  {
    title: 'Vier zijden onafhankelijk opgeteld',
    body: 'De tool roept PVGIS apart aan voor Noord/Oost/Zuid/West (azimut 180/-90/0/+90) en telt de opbrengsten op. Schaduw die de ene zijde op de andere werpt wordt NIET meegenomen.',
  },
  {
    title: 'Zonpaneeltype = monokristallijn silicium',
    body: 'PVGIS pvtechchoice=crystSi staat hard ingesteld. Voor andere technologieën (CIS, CdTe) klopt het temperatuurgedrag niet exact.',
  },
  {
    title: 'PVGIS systeemverlies — geen dubbele inverter-loss',
    body: 'PVGIS rekent grid-tied PV met een omvormer; de "loss%" omvat dus inverter-, kabel-, vervuiling-, temperatuur- en degradatieverliezen. Voor een 48 V DC-DC systeem is er geen omvormer — de gekozen 5 % gaat ervan uit dat je dat gat NIET nóg eens via DC-DC efficiency aftrekt. De DC-DC eff. in de Lighting Designer is een aparte verliespost na de accu (accu → lamp).',
  },
  {
    title: 'Atmosferische horizon altijd "aan"',
    body: 'PVGIS usehorizon=1: het schaduw-effect van het bergachtige terrein wordt meegenomen, maar lokale bomen/gebouwen NIET. Voor stedelijke locaties is een aanvullende DIALux-studie nodig.',
  },
  {
    title: 'Nachtlengte = mid-month dag 15',
    body: 'De nacht-/daglengte wordt 1× per maand berekend voor dag 15. De gemiddelde fout binnen een maand is < 5 minuten — verwaarloosbaar voor een maandgemiddelde, maar het is geen exacte waarde voor een specifieke datum.',
  },
  {
    title: 'Lichtbron = constante belasting',
    body: 'De Lighting Designer rekent met één constant verbruik (Watts) over de hele nacht. Werkelijk gedrag met dimprofielen, PIR, of weersvoorspelling wordt niet gemodelleerd.',
  },
  {
    title: 'Verbruikslimiet door dagelijkse oogst',
    body: 'De brand-uren worden gelimiteerd door min(nachtlengte, accu-energie/lamp, dag-oogst×eff/lamp). De derde term houdt in dat we er vanuit gaan dat alles wat 1 dag wordt opgewekt ook diezelfde nacht weer verbruikt mag worden — voor lange-termijn duurzaamheid is dat correct, voor 1 cloudy night is het pessimistisch.',
  },
  {
    title: 'Accuspanning constant tijdens ontlading (geen voltage sag)',
    body: 'De formule rekent met usable_Wh = Ah × NOMINALE spanning (24 of 48 V). In werkelijkheid daalt de klemspanning naarmate de accu leeg raakt. Voor LiFePO4 — de standaard chemie in 48 V outdoor/off-grid-systemen zoals SPIRIT/Sustainder gebruikt — is de ontlaadcurve heel vlak: tussen ~10 % en ~90 % SoC blijft de spanning binnen ±5 % van nominaal, dus de overschatting van geleverde Wh blijft typisch onder ~3 %. Voor lood-zuur zou dit 10–15 % zijn en zou een veiligheidsmarge nodig zijn. Sustainder publiceert geen expliciete derating-curve in de Anne/Alexia productsheets; de aanname dat we met nominale spanning mogen rekenen is industriestandaard voor LiFePO4-sizing op maandgemiddelden, maar het is een AANNAME en niet een gemeten waarde uit de SPIRIT documentatie.',
  },
  {
    title: 'Cooper\'s declinatieformule',
    body: 'δ = 23,45° × sin(360° × (284+N)/365). Nauwkeurig tot ±1° declinatie → ±4 minuten daglengte op 50° NB. Acceptabel voor maandgemiddelden.',
  },
];

export default function CalculationsPanel() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('calculation_config')
      .select('*')
      .order('key');
    if (!error && data) {
      setRows(data as ConfigRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateRow = async (key: string, value: number) => {
    if (!supabase) return;
    setSaving(key);
    const { error } = await supabase
      .from('calculation_config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
    setSaving(null);
    if (!error) {
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSavedFlash(key);
      setTimeout(() => setSavedFlash(null), 1500);
    }
  };

  const lookup = (key: string): number | undefined =>
    rows.find((r) => r.key === key)?.value;

  const fmt = (n: number | undefined, decimals = 2) =>
    n === undefined ? '—' : Number(n.toFixed(decimals)).toString();

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="rounded-lg border border-[#E14C2A]/40 bg-[#E14C2A]/5 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-[#E14C2A] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#1A1B1A]">
          <p className="font-semibold mb-1">Lees dit voor je iets verandert</p>
          <p className="text-[#3E3D3D]">
            Hieronder staan ALLE formules en constanten waar de tool mee rekent. Constanten
            in de tabel zijn aanpasbaar — wijzigingen werken direct door in nieuwe berekeningen.
            De fysische constanten (zonnedeclinatie, mid-month dag) zijn meestal correct;
            de praktische defaults (accuspanning, DoD, DC-DC eff., autonomie) kunnen per
            installatie verschillen. <strong className="text-[#E14C2A]">Aannames</strong>{' '}
            staan onderaan — controleer of die kloppen voor jouw use case.
          </p>
        </div>
      </div>

      {/* Editable constants */}
      <section>
        <h3 className="text-lg font-semibold text-[#1A1B1A] mb-3">Aanpasbare constanten</h3>
        {loading ? (
          <p className="text-sm text-[#707070]">Laden...</p>
        ) : (
          <div className="overflow-x-auto glass-card p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F5F5] text-[#707070]">
                  <th className="text-left px-4 py-3 font-medium">Sleutel</th>
                  <th className="text-left px-4 py-3 font-medium">Beschrijving</th>
                  <th className="text-right px-4 py-3 font-medium w-32">Waarde</th>
                  <th className="text-left px-4 py-3 font-medium w-16">Eenheid</th>
                  <th className="text-right px-4 py-3 font-medium w-32">Actie</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const editVal = edits[row.key];
                  const dirty = editVal !== undefined && editVal !== row.value;
                  return (
                    <tr key={row.key} className="border-t border-[#E5E5E5]">
                      <td className="px-4 py-3 font-mono text-xs text-[#3E3D3D]">{row.key}</td>
                      <td className="px-4 py-3 text-[#3E3D3D]">{row.description || '—'}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="any"
                          value={editVal !== undefined ? editVal : row.value}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (Number.isFinite(v)) {
                              setEdits((prev) => ({ ...prev, [row.key]: v }));
                            }
                          }}
                          className={`w-full px-2 py-1.5 rounded border bg-white text-right text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] ${
                            dirty ? 'border-[#E14C2A]' : 'border-[#D7D3CD]'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-[#707070]">{row.unit || ''}</td>
                      <td className="px-4 py-3 text-right">
                        {savedFlash === row.key ? (
                          <span className="text-xs text-green-600 font-medium">Opgeslagen</span>
                        ) : dirty ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateRow(row.key, editVal!)}
                              disabled={saving === row.key}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-[#E14C2A] text-white text-xs font-medium hover:bg-[#c43e20] cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3 h-3" />
                              {saving === row.key ? '...' : 'Opslaan'}
                            </button>
                            <button
                              onClick={() =>
                                setEdits((prev) => {
                                  const next = { ...prev };
                                  delete next[row.key];
                                  return next;
                                })
                              }
                              className="p-1 text-[#707070] hover:text-[#E14C2A] cursor-pointer"
                              title="Reset"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#A5A5A4]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Formulas */}
      <section>
        <h3 className="text-lg font-semibold text-[#1A1B1A] mb-3">Formules die de tool gebruikt</h3>
        <div className="space-y-3">
          <FormulaCard
            title="1. PVGIS opbrengst per zijde"
            formula={`GET https://re.jrc.ec.europa.eu/api/v5_3/PVcalc
  ?lat=<lat>&lon=<lon>
  &peakpower=<Wp/1000>           kWp
  &angle=${fmt(lookup('pvgis_panel_angle_deg'), 0)}                     verticale paneelhoek
  &aspect=<azimut>               Z=0, O=−90, W=+90, N=180
  &loss=<system_loss>            ${fmt(lookup('default_system_loss_pct'), 0)} % standaard
  &pvtechchoice=crystSi
  &usehorizon=1
  &raddatabase=PVGIS-SARAH3      (PVGIS-ERA5 buiten Europa/Afrika)`}
            note="PVGIS retourneert E_d (kWh/dag, maand-gemiddelde) en E_m (kWh/maand) voor elke zijde."
          />

          <FormulaCard
            title="2. Combineren van vier zijden"
            formula={`Wh/dag (totaal)   = (E_d_N + E_d_O + E_d_Z + E_d_W) × 1000
kWh/maand (totaal)= E_m_N + E_m_O + E_m_Z + E_m_W
kWh/jaar          = Σ kWh/maand over 12 maanden
gem. dag (Wh)     = kWh/jaar × 1000 / 365.25`}
            note="Aanname: directe optelling — onderlinge schaduw tussen zijden wordt niet gemodelleerd."
          />

          <FormulaCard
            title="3. Nachtlengte (sunset → sunrise)"
            formula={`N    = dag-van-jaar voor dag ${fmt(lookup('mid_month_day'), 0)} van de maand
δ    = ${fmt(lookup('declination_amplitude_deg'))}° × sin(360° × (${fmt(lookup('declination_equinox_offset'), 0)} + N) / ${fmt(lookup('declination_year_days'), 0)})
                                          Cooper's vergelijking
cos(H) = ( sin(−0.833°) − sin(lat)·sin(δ) )
         ÷ ( cos(lat)·cos(δ) )
                                          incl. atmosferische refractie (34')
                                          en zonschijf (16')
daylight_h = 2 × H / 15
night_h    = 24 − daylight_h

Polair: cos(H) > 1 → night = 24 (poolnacht)
        cos(H) < −1 → night = 0 (pooldag)`}
            note="Geeft civil sunrise/sunset, niet bare geometrische daglengte."
          />

          <FormulaCard
            title="4. Gem. opwekvermogen overdag (Summary Card)"
            formula={`per maand m: P_dag(m) = totaal_Wh_dag(m) / dayHours(m, lat)
gemiddelde   = mean over 12 maanden van P_dag(m)`}
          />

          <FormulaCard
            title="5. Beschikbaar verlichtingsvermogen 's nachts (Summary Card)"
            formula={`per maand m: P_nacht(m) = totaal_Wh_dag(m) / nightHours(m, lat)
gemiddelde    = mean over 12 maanden van P_nacht(m)`}
            note="Aanname: alle dagopbrengst wordt 1-op-1 omgezet naar nachtelijk constant vermogen, zonder verdere DC-DC verliezen op deze indicatie. De Lighting Designer hieronder past die wél toe."
          />

          <FormulaCard
            title="6. Wh sunrise-sunset per uur (Detail Tabel)"
            formula={`per maand m: Wh/h = totaal_Wh_dag(m) / dayHours(m, lat)
jaar gemiddelde  = mean over 12 maanden`}
          />

          <FormulaCard
            title="7. Lighting Designer — beschikbare accu-energie"
            formula={`usable_Wh        = batt_Ah × batt_V × (DoD/100) × (eff/100)
                   = batt_Ah × ${fmt(lookup('battery_nominal_voltage'), 0)} × ${fmt(lookup('default_dod_pct'), 0)}/100 × ${fmt(lookup('default_dcdc_eff_pct'), 0)}/100   (defaults)
usable_per_nacht = usable_Wh / autonomie_dagen`}
            note="batt_V = nominale accuspanning. Autonomie = aantal nachten waarover de bruikbare energie wordt verdeeld voor het sizing-doel."
          />

          <FormulaCard
            title="8. Lighting Designer — branduren per maand"
            formula={`from_battery   = usable_per_nacht / lichtW
from_harvest   = (dagelijkse_Wh × eff/100) / lichtW
brand_uren     = min( nightHours, from_battery, from_harvest )
coverage       = brand_uren / nightHours`}
            note="Brand-uren worden begrensd door (a) de bruikbare accu-inhoud, (b) wat je die dag kunt oogsten via DC-DC, en (c) de werkelijke nachtlengte."
          />

          <FormulaCard
            title="9. Lighting Designer — max vermogen voor hele nacht"
            formula={`max_W   = min( usable_per_nacht, dagelijkse_Wh × eff/100 ) / nightHours
dim_pct = min( 100, max_W / lichtW × 100 )`}
            note="Het hoogste constante vermogen waarmee de lamp de héle nacht kan branden, gelimiteerd door zowel accu als dagopbrengst. dim_pct is dat vermogen uitgedrukt als percentage van het volle lampvermogen."
          />
        </div>
      </section>

      {/* Assumptions */}
      <section>
        <h3 className="text-lg font-semibold text-[#1A1B1A] mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#E14C2A]" />
          Aannames die de tool maakt
        </h3>
        <div className="space-y-2">
          {ASSUMPTIONS.map((a, i) => (
            <div key={i} className="rounded-lg border-l-4 border-[#E14C2A] bg-[#E14C2A]/5 p-3">
              <p className="font-semibold text-[#1A1B1A] text-sm">{a.title}</p>
              <p className="text-sm text-[#3E3D3D] mt-0.5">{a.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface FormulaCardProps {
  title: string;
  formula: string;
  note?: string;
}

function FormulaCard({ title, formula, note }: FormulaCardProps) {
  return (
    <div className="glass-card p-4">
      <h4 className="text-sm font-semibold text-[#1A1B1A] mb-2">{title}</h4>
      <pre className="text-xs font-mono text-[#3E3D3D] bg-[#F5F5F5] rounded p-3 overflow-x-auto whitespace-pre-wrap">
        {formula}
      </pre>
      {note && (
        <p className="mt-2 text-xs text-[#707070] italic">{note}</p>
      )}
    </div>
  );
}
