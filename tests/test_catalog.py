import json

import numpy as np
import pytest

from scripts.catalog_to_json import convert_catalog


def test_catalog_includes_only_confirmed_rows_and_uses_data_end_year(tmp_path):
    catalog = tmp_path / "catalog.md"
    catalog.write_text(
        "| Id | Name | Student definition | Scientist definition | Units | Source / instrument | Kind | Grid | Period | DOI | Meaning | Caveats | Status |\n"
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|\n"
        "| T2M | Air temperature | Warm air | Monthly temperature | °C | NASA POWER / MERRA-2 | reanalysis | grid | 1981– | _fill_ | warming | | signed off |\n"
        "| GWETROOT | Soil wetness | Wet roots | Root moisture | 0–1 | NASA POWER / MERRA-2 | reanalysis | grid | 1981– | | moisture | Land only | in store |\n"
        "| CANDIDATE | Maybe | Later | Later | °C | NASA POWER | reanalysis | grid | 1981– | | | | candidate |\n"
    )
    data = tmp_path / "data"
    data.mkdir()
    np.savez(data / "series_T2M.npz", values=np.ones((1, 24)), region_ids=np.array(["USA"]), t0="1981-01")
    np.savez(data / "series_GWETROOT.npz", values=np.ones((1, 36)), region_ids=np.array(["USA"]), t0="1981-01")
    output = data / "variables.json"
    converted = convert_catalog(catalog, data, output)
    assert [row["id"] for row in converted] == ["T2M", "GWETROOT"]
    assert converted[0]["end_year"] == 1982
    assert converted[0]["ratio_scale"] is False
    assert converted[0]["signed_off"] is True
    assert converted[1]["end_year"] == 1983
    assert converted[1]["land_only"] is True
    assert converted[1]["ratio_scale"] is True
    assert json.loads(output.read_text()) == converted


def test_catalog_reports_bad_in_store_row_by_name(tmp_path):
    catalog = tmp_path / "catalog.md"
    catalog.write_text(
        "| Id | Name | Student definition | Scientist definition | Units | Source / instrument | Kind | Grid | Period | DOI | Meaning | Caveats | Status |\n"
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n"
        "| BAD | Bad variable | _fill_ | | °C | NASA POWER | reanalysis | grid | | | | | in store |\n"
    )
    with pytest.raises(ValueError, match="Bad variable"):
        convert_catalog(catalog, tmp_path, tmp_path / "variables.json")


def test_catalog_reports_unrecognized_status_by_name(tmp_path):
    catalog = tmp_path / "catalog.md"
    catalog.write_text(
        "| Id | Name | Student definition | Scientist definition | Units | Source / instrument | Kind | Grid | Period | DOI | Meaning | Caveats | Status |\n"
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|\n"
        "| T2M | Air temperature | Warm air | Monthly temperature | °C | NASA POWER | reanalysis | grid | 1981– | | | | in sorre |\n"
    )
    with pytest.raises(ValueError, match="Air temperature"):
        convert_catalog(catalog, tmp_path, tmp_path / "variables.json")
