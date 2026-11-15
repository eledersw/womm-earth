/** Short labels for the UI; NASA codes and reviewed definitions remain unchanged. */
const labels: Record<string, string> = {
  T2M: "Air temperature",
  T2M_MAX: "Warmest air temperature",
  T2M_MIN: "Coldest air temperature",
  TS: "Surface temperature",
  PRECTOTCORR: "Rain and snow",
  RH2M: "Air humidity",
  QV2M: "Water vapour in air",
  WS10M: "Wind speed",
  PS: "Air pressure",
  GWETROOT: "Soil moisture at roots",
  GWETTOP: "Surface soil moisture",
  SNODP: "Snow depth",
  EVPTRNS: "Evaporation energy",
  ALLSKY_SFC_SW_DWN: "Sunlight at ground",
  CLOUD_AMT: "Cloud cover",
  AOD_55: "Atmospheric haze",
};

export function variableLabel(variable: { id: string; name: string }): string {
  return labels[variable.id] ?? variable.name;
}
