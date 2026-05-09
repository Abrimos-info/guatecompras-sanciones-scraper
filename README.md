# guatecompras-sanciones-scraper

Scrapes supplier sanction records from the [Guatecompras](https://www.guatecompras.gt) Guatemalan public procurement portal and outputs them as NDJSON.

## Requirements

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Usage

### Single supplier

```bash
node src/index.js <id>
```

Fetches sanctions for one supplier ID and prints a single JSON object to stdout. Produces no output if the ID does not exist.

```bash
node src/index.js 491
```

### Range of suppliers

```bash
node src/index.js <start> <end>
```

Fetches each ID in the range sequentially, with a random 1–3 second delay between requests. Prints one JSON object per found supplier. IDs that do not exist or fail are silently skipped (a warning is written to stderr).

```bash
node src/index.js 1 1000
```

### Redirect output to a file

```bash
node src/index.js 1 9999999 > sanctions.ndjson
```

## Output format

Each line of output is a JSON object (NDJSON) with this structure:

```json
{
  "supplier_id": "491",
  "nit": "359815",
  "supplier_name": "DROGUERIA COLON SOCIEDAD ANONIMA",
  "current_status": "Habilitado",
  "sanctions": [
    {
      "start_date": "2020-11-05",
      "duration": "2022-11-05",
      "reason": "Incumplimiento de Contrato",
      "sanction_number": "C3788180",
      "status": "NO VIGENTE",
      "detail_available": true,
      "applying_entity": "MINISTERIO DE SALUD PUBLICA Y ASISTENCIA SOCIAL",
      "procedure_number": null,
      "legal_basis": "Artículo 80 del Decreto 57-92",
      "triggering_action": "No entregó los bienes contratados",
      "nog": null,
      "end_date": "2022-11-04"
    }
  ]
}
```

Fields:

| Field | Description |
|-------|-------------|
| `supplier_id` | The ID passed to the scraper |
| `nit` | Guatemalan tax ID of the supplier |
| `supplier_name` | Supplier's registered name |
| `current_status` | Current registration status |
| `sanctions` | Array of sanction records (empty if none) |
| `sanctions[].start_date` | Sanction start date (ISO 8601) |
| `sanctions[].duration` | Sanction end date (ISO 8601) or a text description |
| `sanctions[].reason` | Reason for the sanction |
| `sanctions[].sanction_number` | Sanction identifier |
| `sanctions[].status` | `VIGENTE` (active) or `NO VIGENTE` (inactive) |
| `sanctions[].detail_available` | `true` if detail fields were loaded, `false` if the detail page was unavailable |
| `sanctions[].applying_entity` | Government entity that applied the sanction |
| `sanctions[].procedure_number` | Internal procedure number, or `null` |
| `sanctions[].legal_basis` | Legal basis for the sanction |
| `sanctions[].triggering_action` | Description of the action that triggered the sanction |
| `sanctions[].nog` | Associated procurement number, or `null` |
| `sanctions[].end_date` | Last day the sanction is in effect (ISO 8601) |

When `detail_available` is `false`, only the five list-level fields (`start_date`, `duration`, `reason`, `sanction_number`, `status`) appear alongside the flag.

## Running tests

```bash
npm test
```

37 unit tests covering date parsing, main page parsing, and detail page parsing.

## Notes

- Supplier IDs are integers between 1 and 99,999,999.
- The scraper sends realistic browser headers to reduce the chance of being blocked. If the site starts returning empty pages, consider adding longer delays or cookie handling.
- Detail pages occasionally return "Fuente de datos no disponible" — this is a site-side intermittent error and is represented as `"detail_available": false` in the output.
