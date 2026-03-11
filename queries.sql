-- ============================================================
-- HOTEL BOOKING DEMAND — SQL QUERIES
-- Author: Samuel Then | Data Analyst
-- Dataset: kaggle.com/datasets/jessemostipak/hotel-booking-demand
-- File: hotel_bookings.csv | 119,390 rows × 32 columns
-- ============================================================


-- ============================================================
-- SECTION 1: DATA CLEANING
-- ============================================================

-- 1.1 Preview the raw data
SELECT * FROM hotel_bookings LIMIT 10;

-- 1.2 Check for nulls in key columns
SELECT
  SUM(CASE WHEN adr IS NULL THEN 1 ELSE 0 END)           AS null_adr,
  SUM(CASE WHEN country IS NULL THEN 1 ELSE 0 END)        AS null_country,
  SUM(CASE WHEN agent IS NULL THEN 1 ELSE 0 END)          AS null_agent,
  SUM(CASE WHEN children IS NULL THEN 1 ELSE 0 END)       AS null_children,
  SUM(CASE WHEN market_segment IS NULL THEN 1 ELSE 0 END) AS null_market
FROM hotel_bookings;

-- 1.3 Replace NULL children with 0
UPDATE hotel_bookings
SET children = 0
WHERE children IS NULL;

-- 1.4 Replace NULL country with 'Unknown'
UPDATE hotel_bookings
SET country = 'Unknown'
WHERE country IS NULL OR TRIM(country) = '';

-- 1.5 Remove rows where ADR is negative or zero (data errors)
DELETE FROM hotel_bookings
WHERE adr <= 0;

-- 1.6 Remove extreme ADR outliers (above $5000 — likely data entry errors)
DELETE FROM hotel_bookings
WHERE adr > 5000;

-- 1.7 Add a calculated total_nights column
ALTER TABLE hotel_bookings ADD COLUMN total_nights INTEGER;
UPDATE hotel_bookings
SET total_nights = stays_in_weekend_nights + stays_in_week_nights;

-- 1.8 Remove bookings with zero nights (same-day cancellations, not useful)
DELETE FROM hotel_bookings
WHERE total_nights = 0 AND is_canceled = 0;

-- 1.9 Add a revenue column (ADR × total nights)
ALTER TABLE hotel_bookings ADD COLUMN revenue DECIMAL(10,2);
UPDATE hotel_bookings
SET revenue = adr * total_nights;

-- 1.10 Standardize arrival_date_month to month number for sorting
ALTER TABLE hotel_bookings ADD COLUMN arrival_month_num INTEGER;
UPDATE hotel_bookings SET arrival_month_num = CASE arrival_date_month
  WHEN 'January'   THEN 1  WHEN 'February'  THEN 2
  WHEN 'March'     THEN 3  WHEN 'April'     THEN 4
  WHEN 'May'       THEN 5  WHEN 'June'      THEN 6
  WHEN 'July'      THEN 7  WHEN 'August'    THEN 8
  WHEN 'September' THEN 9  WHEN 'October'   THEN 10
  WHEN 'November'  THEN 11 WHEN 'December'  THEN 12
END;


-- ============================================================
-- SECTION 2: KEY PERFORMANCE INDICATORS
-- ============================================================

-- 2.1 Overall KPIs — Total bookings, revenue, cancellation rate, ADR
SELECT
  COUNT(*)                                                        AS total_bookings,
  SUM(CASE WHEN is_canceled = 0 THEN 1 ELSE 0 END)               AS confirmed_bookings,
  SUM(CASE WHEN is_canceled = 1 THEN 1 ELSE 0 END)               AS canceled_bookings,
  ROUND(AVG(CASE WHEN is_canceled = 1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate_pct,
  ROUND(SUM(CASE WHEN is_canceled = 0 THEN revenue ELSE 0 END),2)  AS total_revenue,
  ROUND(AVG(CASE WHEN is_canceled = 0 THEN adr END),2)            AS avg_daily_rate,
  ROUND(AVG(total_nights),1)                                      AS avg_length_of_stay,
  ROUND(AVG(lead_time),1)                                         AS avg_lead_time_days
FROM hotel_bookings;

-- 2.2 KPIs by hotel type
SELECT
  hotel,
  COUNT(*)                                                         AS total_bookings,
  ROUND(AVG(CASE WHEN is_canceled = 1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate_pct,
  ROUND(SUM(CASE WHEN is_canceled = 0 THEN revenue ELSE 0 END),2)  AS total_revenue,
  ROUND(AVG(CASE WHEN is_canceled = 0 THEN adr END),2)             AS avg_daily_rate,
  ROUND(AVG(total_nights),1)                                       AS avg_length_of_stay,
  ROUND(AVG(lead_time),1)                                          AS avg_lead_time_days
FROM hotel_bookings
GROUP BY hotel;


-- ============================================================
-- SECTION 3: REVENUE & BOOKING TRENDS
-- ============================================================

-- 3.1 Monthly bookings and revenue by hotel (for trend chart)
SELECT
  hotel,
  arrival_date_year                                               AS year,
  arrival_date_month                                              AS month,
  arrival_month_num,
  COUNT(*)                                                        AS total_bookings,
  SUM(CASE WHEN is_canceled = 0 THEN 1 ELSE 0 END)               AS confirmed_bookings,
  ROUND(SUM(CASE WHEN is_canceled = 0 THEN revenue ELSE 0 END),2) AS monthly_revenue,
  ROUND(AVG(CASE WHEN is_canceled = 0 THEN adr END),2)            AS avg_daily_rate
FROM hotel_bookings
GROUP BY hotel, arrival_date_year, arrival_date_month, arrival_month_num
ORDER BY hotel, year, arrival_month_num;

-- 3.2 Revenue by market segment
SELECT
  market_segment,
  COUNT(*)                                                         AS total_bookings,
  SUM(CASE WHEN is_canceled = 0 THEN 1 ELSE 0 END)                AS confirmed_bookings,
  ROUND(AVG(CASE WHEN is_canceled = 1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate_pct,
  ROUND(SUM(CASE WHEN is_canceled = 0 THEN revenue ELSE 0 END),2)  AS total_revenue,
  ROUND(AVG(CASE WHEN is_canceled = 0 THEN adr END),2)             AS avg_daily_rate
FROM hotel_bookings
GROUP BY market_segment
ORDER BY total_revenue DESC;

-- 3.3 Top 10 countries by bookings
SELECT
  country,
  COUNT(*)                                                         AS total_bookings,
  SUM(CASE WHEN is_canceled = 0 THEN 1 ELSE 0 END)                AS confirmed_bookings,
  ROUND(AVG(CASE WHEN is_canceled = 1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate_pct,
  ROUND(SUM(CASE WHEN is_canceled = 0 THEN revenue ELSE 0 END),2)  AS total_revenue
FROM hotel_bookings
GROUP BY country
ORDER BY total_bookings DESC
LIMIT 10;


-- ============================================================
-- SECTION 4: CANCELLATION ANALYSIS
-- ============================================================

-- 4.1 Cancellation rate by deposit type
SELECT
  deposit_type,
  COUNT(*)                                                         AS total_bookings,
  ROUND(AVG(CASE WHEN is_canceled = 1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate_pct
FROM hotel_bookings
GROUP BY deposit_type
ORDER BY cancellation_rate_pct DESC;

-- 4.2 Cancellation rate by lead time bucket
SELECT
  CASE
    WHEN lead_time <= 7   THEN '0–7 days'
    WHEN lead_time <= 30  THEN '8–30 days'
    WHEN lead_time <= 90  THEN '31–90 days'
    WHEN lead_time <= 180 THEN '91–180 days'
    ELSE '180+ days'
  END AS lead_time_bucket,
  COUNT(*)                                                         AS total_bookings,
  ROUND(AVG(CASE WHEN is_canceled = 1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate_pct
FROM hotel_bookings
GROUP BY lead_time_bucket
ORDER BY MIN(lead_time);

-- 4.3 Cancellation rate by customer type
SELECT
  customer_type,
  COUNT(*)                                                         AS total_bookings,
  ROUND(AVG(CASE WHEN is_canceled = 1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate_pct
FROM hotel_bookings
GROUP BY customer_type
ORDER BY cancellation_rate_pct DESC;


-- ============================================================
-- SECTION 5: TABLEAU-READY EXPORT TABLES
-- ============================================================

-- 5.1 Monthly KPI summary — plug directly into Tableau
SELECT
  hotel,
  arrival_date_year                                               AS year,
  arrival_date_month                                             AS month,
  arrival_month_num,
  COUNT(*)                                                       AS total_bookings,
  SUM(CASE WHEN is_canceled = 0 THEN 1 ELSE 0 END)              AS confirmed_bookings,
  SUM(CASE WHEN is_canceled = 1 THEN 1 ELSE 0 END)              AS canceled_bookings,
  ROUND(AVG(CASE WHEN is_canceled=1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate,
  ROUND(SUM(CASE WHEN is_canceled=0 THEN revenue ELSE 0 END),2) AS total_revenue,
  ROUND(AVG(CASE WHEN is_canceled=0 THEN adr END),2)            AS avg_daily_rate,
  ROUND(AVG(total_nights),1)                                    AS avg_nights,
  ROUND(AVG(lead_time),1)                                       AS avg_lead_time
FROM hotel_bookings
GROUP BY hotel, arrival_date_year, arrival_date_month, arrival_month_num
ORDER BY hotel, year, arrival_month_num;

-- 5.2 Market segment summary — plug directly into Tableau
SELECT
  hotel,
  market_segment,
  COUNT(*)                                                       AS total_bookings,
  ROUND(AVG(CASE WHEN is_canceled=1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate,
  ROUND(SUM(CASE WHEN is_canceled=0 THEN revenue ELSE 0 END),2) AS total_revenue,
  ROUND(AVG(CASE WHEN is_canceled=0 THEN adr END),2)            AS avg_daily_rate
FROM hotel_bookings
GROUP BY hotel, market_segment
ORDER BY hotel, total_revenue DESC;

-- 5.3 Country summary — plug directly into Tableau
SELECT
  country,
  COUNT(*)                                                       AS total_bookings,
  SUM(CASE WHEN is_canceled=0 THEN 1 ELSE 0 END)                AS confirmed_bookings,
  ROUND(AVG(CASE WHEN is_canceled=1 THEN 1.0 ELSE 0 END)*100,2) AS cancellation_rate,
  ROUND(SUM(CASE WHEN is_canceled=0 THEN revenue ELSE 0 END),2) AS total_revenue,
  ROUND(AVG(CASE WHEN is_canceled=0 THEN adr END),2)            AS avg_daily_rate
FROM hotel_bookings
GROUP BY country
ORDER BY total_bookings DESC;
