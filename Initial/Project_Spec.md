# MASTER CONTEXT & BUILD SPEC: TORUS $5K HACKATHON BOUNTY

## 1. STORY BACKGROUND & COMPANY CONTEXT (WHO IS TORUS?)
We are building a submission for the **$5,000 Torus Hackathon Bounty (Energy x AI Infrastructure)**. 

### About Torus (`torus.co`)
- **Who they are:** Torus is a fast-growing clean energy and grid-scale energy storage company headquartered in **South Jordan, Utah** (Salt Lake City metro area), founded by CEO Nate Walkingshaw.
- **What they build:** Torus builds modular hybrid energy storage hardware (**Torus Nova**, combining fast-response mechanical spinning flywheels with chemical batteries) and virtual power plant / grid orchestration software (**Torus Lattice**).
- **The Real-World Crisis Torus Solves:**
  1. **The AI Power Collision:** AI companies are building massive data centers in 18 to 36 months, demanding hundreds of megawatts of power. When AI clusters run training or batch jobs, power demand spikes rapidly.
  2. **The Grid Bottleneck:** Power utilities take 7 to 10 years to build new transmission lines. Because software and data centers ignore grid conditions, power lines get jammed ("grid congestion"), wholesale electricity prices spike from $15/MWh to $300+/MWh during evening peak hours, and utilities are forced to burn dirty fossil-fuel "peaker" plants.
  3. **The Two Software Solutions:** To solve this without waiting 10 years for new wires, software must become grid-aware—either by **time-shifting workloads/storage locally out of grid rush hours (Option 1)** or by **spatially routing AI compute across regions to wherever solar and wind power are currently peaking (Option 2)**.

---

## 2. VERBATIM HACKATHON PROMPT (EXACT TEXT FROM THE OFFICIAL POSTER)

> **ENERGY x AI INFRASTRUCTURE**
> **TORUS HACKATHON BOUNTY — $5K**
>
> ---
> ### **OPTION 1: RUSH HOUR FOR ELECTRONS**
> The grid has a rush hour: demand spikes, prices jump, solar fades. Most software ignores it.
> **Build software that knows when the grid is jammed and stays out of traffic.**
> - A navigation app for electricity
> - A traffic report for tomorrow's grid
> - Agents that schedule around clean power
>
> | *How would you manage the grid's congestion?*
>
> **Data:** EIA • CAISO • ERCOT • Open-Meteo • Electricity Maps
>
> ---
> ### **OPTION 2: COMPUTE FOLLOWS THE SUN**
> Power is cleaner and cheaper in different places at different times. AI jobs that can move, should.
> **Build something that decides where and when compute should run.**
> - A job router that shows carbon saved
> - Agents that bid for the cleanest slots
> - A live map of where to train right now
>
> | *How would you route the cheapest and cleanest energy?*
>
> **Data:** EIA • NREL • NASA POWER • Open-Meteo • cluster traces
>
> ---
> ### **OFFICIAL JUDGING RULES & EXPECTATIONS (BOTTOM OF POSTER):**
> - *"We don't expect you to be energy and grid experts – they are very complex systems. We care more about engineering skill and creativity."*
> - *"Free and open-source data only"*
> - *"Simulated data is fine if labeled"*
> - *"Judged on creativity, clarity of insight, and execution"*

---

## 3. OUR SELECTED DIRECTION

**[USER DECISION: Read both options above so you understand the full Torus ecosystem. For this build, I choose OPTION 1 / OPTION 2 ( <-- Edit to keep your final choice! ) as our primary focus.]**

*(Note to AI Assistant: Even though we are focusing on our chosen track, keep the overall Torus narrative of "Energy x AI Infrastructure" front and center in the UI copy, metrics, and architecture!)*

---

## 4. STRICT ENGINEERING GUARDRAILS (WHAT TO FOCUS ON vs. WHAT TO AVOID)

### 🚨 DO NOT WASTE TIME ON (STRICT ANTI-GOALS):
1. **NO PhD Electrical Engineering Math:** Look at the poster rule: *"We don't expect you to be energy and grid experts... We care more about engineering skill and creativity."* Do NOT waste time writing complex AC power-flow differential equations or multi-hour linear programming solvers. Keep the scoring math to a clean, transparent, deterministic 15-to-20 line formula.
2. **NO LLM Calls Inside the Core Math/Routing Loop:** "Agents that schedule / bid" means **fast, deterministic software policy agents** (evaluating SLA deadlines, solar surplus, and grid congestion in <5ms TypeScript), NOT calling OpenAI/Claude to do arithmetic.
3. **NO Fragile API Dependencies:** Pull real live/forecast solar and wind data from the **Open-Meteo API** (free, no key required) and regional grid profiles (**EIA / CAISO / ERCOT**), but ALWAYS include a seamless pre-cached fallback dataset so the app never crashes or hangs during judging.
4. **NO Heavy Boilerplate (No Auth/Login/DB Setup):** Judges want to open the URL and immediately experience the interactive control plane within 3 seconds.

### 🎯 WHERE 80% OF OUR EFFORT MUST GO (HOW WE WIN THE $5K):
1. **5-Second "Clarity of Insight" Scoreboard:**
   - Top of the screen must immediately contrast **"Blind Default Execution (Ignoring the Grid)"** vs. **"Our Torus-Aware Smart System"** showing exact **Dollars Saved ($)**, **Carbon Avoided (kg CO₂)**, and **Peak Grid Congestion Avoided (MW)**.
2. **Interactive "24-Hour Time-Travel Slider" & Simulation Controls:**
   - Give the judge an interactive 24-hour scrubber (`00:00` to `23:00`) + `"Auto-Play 24h Simulation"` button so they can see how solar peaks at midday, how the 6:00 PM "Electron Rush Hour" hits when solar fades, and how our software automatically reacts.
   - Include a `"+ Simulate Incoming AI Workloads"` button (using clearly labeled simulated GPU cluster traces) so judges can test the system live.
3. **High-Craft Visual Execution (Next.js + TypeScript + Tailwind + Framer Motion):**
   - **If Option 1 ("Rush Hour for Electrons") is chosen:** Build a "Waze / Google Maps for Grid Traffic" control plane focusing on CAISO/ERCOT/Utah—featuring a live 24-hour Grid Traffic Report (Green Solar Surplus Window vs. Red Evening Rush Hour Jam), an automated AI task/battery scheduler that shifts flexible jobs out of the 5 PM–9 PM ramp, and live congestion alerts.
   - **If Option 2 ("Compute Follows the Sun") is chosen:** Build a "Multi-Region Sun-Following AI Router" control plane—featuring a live US map across 4 data center regions (Virginia PJM, Texas ERCOT, Utah PacifiCorp, California CAISO), autonomous job agents that bid for clean solar/wind slots based on deadline urgency, and animated routing arcs showing compute following the sun westward across the day.

---

## 5. DETERMINISTIC DATA & SCORING MODEL (CLEAN & TRANSPARENT)

1. **Live Weather & Solar Input (Open-Meteo API):**
   Fetch hourly `shortwave_radiation` ($W/m^2$) and `wind_speed_10m` ($km/h$) for the target grid coordinate(s).
2. **Grid Congestion & Clean Power Calculation (Per Hour $t \in [0..23]$):**
   - `clean_generation_mw = solar_mw(shortwave_radiation) + wind_mw(wind_speed) + baseload_clean_mw`
   - `net_load_mw = total_demand_mw[t] - clean_generation_mw` (The "Duck Curve" / Grid Stress indicator)
   - `clean_pct = (clean_generation_mw / total_demand_mw[t]) * 100`
   - **Rush Hour Detection:** When `net_load_mw` spikes or ramps steeply (typically 17:00–21:00 local time as solar drops to 0), spot prices jump ($150–$250/MWh) and carbon intensity spikes (>500 gCO2/kWh). During midday solar peaks (11:00–15:00), spot prices drop ($10–$25/MWh) and carbon intensity plummets (<80 gCO2/kWh).
3. **Autonomous Scheduling / Slot-Bidding Policy Agent:**
   - Each incoming compute job has `power_mw`, `duration_hours`, and `deadline_hours` (SLA slack).
   - Calculate **Urgency Score**: `urgency = 1 / max(0.5, deadline_hours - duration_hours)`.
   - Jobs with high slack automatically avoid high `net_load_mw` (Rush Hour) slots and lock into the lowest-cost, highest-`clean_pct` temporal window (Option 1) or spatial-temporal region (Option 2) before their deadline expires.