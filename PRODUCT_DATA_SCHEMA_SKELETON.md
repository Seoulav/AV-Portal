# PRODUCT DATA SCHEMA — SKELETON DRAFT

**Status:** Preliminary skeleton based on the first RTCOM material set.  
**Purpose:** Prepare the structure only. Do not finalize fields or migrate data until the official RTCOM material is received and reviewed.

---

## 0. Core Principle

Use three layers instead of one giant flat product record.

1. **Common Product Core** — fields shared by all products
2. **Category Specification Profile** — fields that differ by product category
3. **Evidence / Documents** — source and verification information for every important value

Do not guess missing values. Use `UNKNOWN`, `UNVERIFIED`, or `REVIEW_REQUIRED` until confirmed.

---

## 1. Common Product Core

```yaml
product:
  identity:
    manufacturer:
    series:
    model:
    product_name:
    item_level:       # series / model / module / bundle / cable / accessory
    status:           # active / legacy / discontinued / unknown
    aliases: []

  classification:
    domain:
    category:
    subtype:
    tags: []

  summary:
    short_description:
    key_features: []

  media:
    main_image:
    front_image:
    rear_image:
    other_images: []

  physical:
    width:
    depth:
    height:
    rack_unit:
    weight:

  power:
    input_power:
    power_consumption:
    poe_role:
    redundancy:

  environment:
    operating_temperature:
    operating_humidity:

  control:
    control_interfaces: []
    control_protocols: []

  verification:
    overall_status:
    reviewed_at:
    notes:
```

This is a conceptual structure, not a final JSON schema.

---

## 2. Port / I/O Skeleton

Physical ports, signal meaning, and logical capacity must not be flattened into one field.

```yaml
io_ports:
  - direction:        # input / output / bidirectional
    connector:
    signal:
    protocol:
    quantity:
    fixed_or_optional:
    card_or_module:
    condition:
    verification:
    source_ref:
```

Important distinction:

- Connector = HDMI Type A, RJ45, LC, etc.
- Signal = HDMI video, SDI, analog audio, control, etc.
- Protocol = HDBaseT, Dante, TCP/IP, RS-232, etc.
- Quantity = confirmed physical count
- Capacity = channel/resource capacity should be stored separately where relevant

---

## 3. Capability Skeleton

```yaml
capabilities:
  video:
    max_resolution:
    frame_rate:
    chroma:
    video_bandwidth:
    hdcp:
    hdr:
    seamless_switching:
    scaling:
    video_wall:
    multiview:
    genlock:
    edid:

  audio:
    extraction:
    insertion:
    embedded_audio:
    network_audio:
    dante_channels:

  transport:
    medium:
    max_distance:
    distance_condition:

  system:
    hot_swap:
    redundant_power:
    test_pattern:
```

Only use fields relevant to the category. Do not show empty irrelevant fields to users.

---

# 4. Category Specification Profiles

## 4.1 Matrix Switcher / Chassis

Observed RTCOM material suggests the following groups are important:

```yaml
matrix_profile:
  chassis:
    max_input_channels:
    max_output_channels:
    input_slot_count:
    output_slot_count:
    ports_per_slot:
    supported_card_types: []
    touch_panel:
    cooling:
    redundant_power:
    hot_swap:

  switching:
    seamless:
    scaling:
    supported_video_formats:
    bandwidth:
    hdcp:
    edid:
    video_wall:
    quadview:
    genlock:

  audio:
    audio_extraction:
    audio_insertion:
    dante_option:
    dante_capacity:
```

Do not infer slot counts or supported cards until the official material confirms them.

---

## 4.2 Matrix Module / Input & Output Card

```yaml
matrix_module_profile:
  module_role:        # input / output
  host_family:
  interface:
  ports_per_card:
  scaler:
  seamless:
  video_wall:
  quadview:
  audio_extraction:
  audio_insertion:
  dante_option:
  genlock:
```

Compatibility between a card and chassis belongs in a **relation/compatibility area**, not in the category itself.

---

## 4.3 Integrated Matrix / Small Matrix / Switcher

```yaml
integrated_matrix_profile:
  input_count:
  output_count:
  input_connector:
  output_connector:
  topology:
  bandwidth:
  max_resolution:
  hdmi_version:
  hdcp:
  edid:
  control_interfaces: []
  power:
```

---

## 4.4 Distribution Amplifier

```yaml
distribution_profile:
  input_count:
  output_count:
  input_connector:
  output_connector:
  signal:
  bandwidth:
  max_resolution:
  hdcp:
  edid:
  audio_features:
  power:
```

---

## 4.5 AV Extender

```yaml
extender_profile:
  role:               # transmitter / receiver / transceiver / bundle
  transport_medium:   # CAT / fiber / etc.
  input_signal:
  output_signal:
  connector_in:
  connector_out:
  max_distance:
  distance_condition:
  bandwidth:
  max_resolution:
  hdcp:
  edid:
  audio_support:
  control_support:
  power:
  poe_role:
```

TX/RX bundle and individual model identity must remain separate until RTCOM confirms the selling unit.

---

## 4.6 Extender Frame / Module System

```yaml
extender_frame_profile:
  frame_capacity:
  supported_module_roles:
  mixed_tx_rx_support:
  shared_power:
  supported_transport:
  max_resolution:
```

---

## 4.7 Cable

```yaml
cable_profile:
  connector_end_a:
  connector_end_b:
  medium:
  active_or_passive:
  optical:
  directionality:
  available_lengths:
  max_length:
  video_bandwidth:
  supported_video_format:
  hdcp:
  edid:
  cec:
  external_power_required:
  installation_features:
```

Length variants and selling SKUs should be finalized only after official material confirms them.

---

# 5. Product Relations Skeleton

Use relations instead of duplicating product records.

```yaml
relations:
  - type:
    target_product:
    condition:
    verification:
    source_ref:
```

Possible relation types:

- belongs_to_series
- compatible_with_chassis
- uses_input_card
- uses_output_card
- paired_with_tx
- paired_with_rx
- requires_power_supply
- optional_module
- related_document
- replacement_for
- successor_of

These names are placeholders and are not yet final schema values.

---

# 6. Documents / Evidence Skeleton

The current RTCOM material includes manuals, specifications, catalogs, command documents, images, drawings and presentation material. Preserve that distinction.

```yaml
documents:
  - document_id:
    document_type:    # datasheet / manual / catalog / command / drawing / presentation / other
    title:
    language:
    version:
    revision:
    issue_date:
    source_type:      # manufacturer / internal / legacy / partner
    file_name:
    applies_to: []
    status:
    notes:
```

---

## 6.1 Per-field Source / Verification

Important technical values should be traceable.

```yaml
source_ref:
  document_id:
  page:
  section:
  quoted_label:
  verification_status:
  conflict_note:
```

Suggested verification states:

- `VERIFIED`
- `CATALOG_ONLY`
- `MANUAL_CONFIRMED`
- `CONFLICTED`
- `UNVERIFIED`
- `REVIEW_REQUIRED`
- `LEGACY_SOURCE`

Final naming should be decided after reviewing the official RTCOM material.

---

# 7. Images

```yaml
images:
  - role:             # main / front / rear / diagram / application / other
    file:
    caption:
    source:
    status:
```

Do not infer `front` or `rear` solely from filename if the image cannot be confirmed.

---

# 8. Initial RTCOM Families to Support

The preliminary archive contains material for at least these groups:

- XDM Series
- SPX Series
- VDM Series
- Small / Integrated Matrix products
- Distribution products
- Extenders / Extender frames
- Cable products
- Other RTCOM products

The official RTCOM package received later should determine the definitive list.

---

# 9. Source Priority Proposal

When the same value differs across documents, do not silently overwrite it.

Provisional priority for review:

1. Latest official RTCOM specification / official confirmed data
2. Latest official user manual
3. Latest official catalog
4. Product drawing / command documentation where applicable
5. Older / legacy documents
6. Existing Portal data

A newer document does not automatically win when the product revision or applicable model differs. Conflicts must be recorded and reviewed.

---

# 10. Tomorrow's RTCOM Review Checklist

When the official RTCOM material arrives, confirm:

### Product identity
- Official manufacturer display name
- Series
- Model list
- Active / discontinued / legacy products
- TX/RX bundle vs separate model
- PSE variant meaning
- Selling unit / SKU if RTCOM manages it

### Matrix
- Chassis lineup
- Physical input/output slot counts
- Ports per card
- Supported cards per chassis
- Power redundancy
- Hot-swap scope
- Touch panel
- Fan / PSU structure

### Video
- HDMI / SDI / DP / Fiber / CAT support
- Resolution
- Frame rate
- Chroma
- Bandwidth
- HDCP
- EDID
- HDR
- Scaling
- Seamless switching
- Video wall / multiview
- Genlock

### Audio
- Audio extraction
- Audio insertion
- Analog audio
- Dante availability
- Dante channel counts and conditions

### Extenders
- TX/RX/transceiver roles
- CAT / Fiber medium
- Distance
- Resolution at each distance
- HDBaseT / protocol versions
- PoE/PSE/PD behavior
- Power requirements

### Physical / environment
- Dimensions
- Weight
- Rack units
- Power input
- Power consumption
- Operating temperature/humidity

### Documents
- Current manual
- Current datasheet
- Current catalog
- Drawings
- Command/API documents
- Current product images
- Superseded documents

---

# 11. Items Explicitly Not Finalized Yet

Do not finalize these until the official RTCOM data is reviewed:

- Database implementation
- JSON schema
- field data types
- required/optional rules
- canonical internal IDs
- SKU model
- compatibility engine
- migration of current 31 items
- product status values
- exact verification workflow
- category-specific filters
- admin input form structure

---

# 12. Next Step

Official RTCOM material
→ reconcile product/model list
→ identify conflicts and legacy files
→ approve field groups
→ create `PRODUCT_DATA_SCHEMA.md`
→ create product-entry template
→ populate RTCOM data
