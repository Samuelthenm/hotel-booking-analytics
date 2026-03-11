# hotel-kpi-dashboard

Analysis of hotel booking demand using a real Kaggle dataset — 119,390 reservations across two hotel types (City Hotel and Resort Hotel) covering 2015–2017. Built this one to show hospitality analytics in a professional context, since a lot of my background is in that space.

---

## what's in here

```
hotel-kpi-dashboard/
│
├── sql/
│   └── queries.sql       # cleaning, KPI aggregations, Tableau-ready exports
│
├── data/
│   └── hotel_kpi_summary.csv   # clean aggregated output from SQL
│
├── index.html            # interactive KPI dashboard
├── style.css             # dashboard styles
├── main.js               # dashboard logic and chart rendering
│
└── README.md
```

---

## the data

Kaggle dataset by Jesse Mostipak — link here:
https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand

119,390 rows × 32 columns. Covers two properties — a city hotel and a resort hotel in Portugal. Key fields include ADR (average daily rate), lead time, market segment, country of origin, deposit type, customer type, and cancellation status.

Raw CSV is not pushed to this repo. Download directly from Kaggle to run the queries yourself.

---

## what I looked at

- total revenue, ADR, cancellation rate and average length of stay by hotel type
- monthly revenue trends — city hotel vs resort hotel
- which market segments drive the most revenue (and which cancel the most)
- how cancellation rate increases with booking lead time
- top countries by booking volume
- booking status breakdown — confirmed vs canceled
- customer type analysis and which segments are most reliable

---

## cleaning notes

Main things handled in SQL before analysis:

- replaced NULL children values with 0
- filled missing country codes with 'Unknown'
- removed rows where ADR was zero or negative (data entry errors)
- dropped extreme ADR outliers above $5,000
- calculated total_nights as weekend nights + weekday nights combined
- added a revenue column (ADR × total nights) for confirmed stays only
- standardized month names to numeric values for proper sort order in charts

All cleaning steps are documented in sql/queries.sql.

---

## tools used

SQL, Tableau, Advanced Excel, Power BI, DAX

Tableau dashboard coming soon — will link here once published to Tableau Public.

---

## dashboard

Open index.html in any browser. Use the filter buttons at the top to switch between All Hotels, City Hotel, and Resort Hotel — every chart updates.

---

built by Samuel Then
linkedin.com/in/samuel-then
