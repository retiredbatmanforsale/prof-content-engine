import React, { useState, useMemo } from 'react';
import styles from './styles.module.css';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Ad {
  id: number;
  bid: number;
  truePCTR: number;
  predPCTR: number;
}

interface AuctionResult {
  winner: Ad | null;
  pricePerClick: number;
  expectedRevenue: number;
  trueValue: number;
  overpricing: number;
}

function runAuction(ads: Ad[]): AuctionResult {
  if (ads.length === 0) {
    return { winner: null, pricePerClick: 0, expectedRevenue: 0, trueValue: 0, overpricing: 0 };
  }
  const scored = ads.map((a) => ({ ad: a, score: a.predPCTR * a.bid }));
  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0].ad;
  const next = scored.length > 1 ? scored[1].score : scored[0].score * 0.5;
  const pricePerClick = Math.min(winner.bid, next / Math.max(winner.predPCTR, 1e-6));
  const expectedRevenue = winner.truePCTR * pricePerClick;
  const trueValue = winner.truePCTR * winner.bid;
  const overpricing = pricePerClick - winner.truePCTR * winner.bid / Math.max(winner.truePCTR, 1e-6);
  return { winner, pricePerClick, expectedRevenue, trueValue, overpricing };
}

export default function AdAuctionSimulator() {
  const [calibFactor, setCalibFactor] = useState(1.8);
  const [adsPerAuction, setAdsPerAuction] = useState(8);
  const [seed, setSeed] = useState(13);

  const result = useMemo(() => {
    const N_auctions = 300;
    const rng = mulberry32(seed);

    const calibratedRevenue: number[] = [];
    const miscalibratedRevenue: number[] = [];
    const overpricingValues: number[] = [];
    const wrongWinnerCount = { val: 0 };

    type ScatterPoint = { trueVal: number; pricePaid: number; overpriced: boolean };
    const scatter: ScatterPoint[] = [];

    let exemplarCalib: { ads: Ad[]; result: AuctionResult } | null = null;
    let exemplarMis: { ads: Ad[]; result: AuctionResult } | null = null;

    for (let n = 0; n < N_auctions; n++) {
      const adsCalib: Ad[] = [];
      const adsMis: Ad[] = [];
      for (let i = 0; i < adsPerAuction; i++) {
        const bid = 0.4 + rng() * 4;
        const truePCTR = 0.005 + rng() * 0.12;
        const adC: Ad = { id: i, bid, truePCTR, predPCTR: truePCTR };
        adsCalib.push(adC);
        const adM: Ad = {
          id: i,
          bid,
          truePCTR,
          predPCTR: Math.min(0.99, truePCTR * calibFactor),
        };
        adsMis.push(adM);
      }
      const rC = runAuction(adsCalib);
      const rM = runAuction(adsMis);
      calibratedRevenue.push(rC.expectedRevenue);
      miscalibratedRevenue.push(rM.expectedRevenue);

      if (rC.winner && rM.winner && rC.winner.id !== rM.winner.id) {
        wrongWinnerCount.val++;
      }

      if (rM.winner) {
        const trueVal = rM.winner.truePCTR * rM.winner.bid;
        const pricePaid = rM.winner.truePCTR * rM.pricePerClick;
        scatter.push({ trueVal, pricePaid, overpriced: pricePaid > trueVal });
        overpricingValues.push(pricePaid - trueVal);
      }

      if (n === 0) {
        exemplarCalib = { ads: adsCalib, result: rC };
        exemplarMis = { ads: adsMis, result: rM };
      }
    }

    const meanCalib = calibratedRevenue.reduce((a, b) => a + b, 0) / N_auctions;
    const meanMis = miscalibratedRevenue.reduce((a, b) => a + b, 0) / N_auctions;
    const meanOverpricing =
      overpricingValues.reduce((a, b) => a + b, 0) / Math.max(1, overpricingValues.length);
    const wrongWinnerRate = wrongWinnerCount.val / N_auctions;

    return {
      meanCalib,
      meanMis,
      meanOverpricing,
      wrongWinnerRate,
      scatter,
      exemplarCalib,
      exemplarMis,
      N_auctions,
    };
  }, [calibFactor, adsPerAuction, seed]);

  const W = 720;
  const Hgt = 290;
  const padL = 60;
  const padR = 24;
  const padT = 28;
  const padB = 44;
  const innerW = W - padL - padR;
  const innerH = Hgt - padT - padB;

  const xMax = Math.max(0.4, ...result.scatter.map((p) => Math.max(p.trueVal, p.pricePaid)));
  const yMax = xMax;
  const xPx = (v: number) => padL + (v / xMax) * innerW;
  const yPx = (v: number) => padT + (1 - v / yMax) * innerH;

  const renderScatter = () => {
    const elements: React.ReactNode[] = [];

    for (let g = 0; g <= 4; g++) {
      const tv = (g / 4) * xMax;
      elements.push(
        <line
          key={`gx${g}`}
          x1={xPx(tv)}
          y1={padT}
          x2={xPx(tv)}
          y2={padT + innerH}
          stroke="#f1f5f9"
          strokeWidth={1}
        />
      );
      elements.push(
        <line
          key={`gy${g}`}
          x1={padL}
          y1={yPx(tv)}
          x2={padL + innerW}
          y2={yPx(tv)}
          stroke="#f1f5f9"
          strokeWidth={1}
        />
      );
      elements.push(
        <text
          key={`xt${g}`}
          x={xPx(tv)}
          y={padT + innerH + 14}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
        >
          ${tv.toFixed(2)}
        </text>
      );
      elements.push(
        <text
          key={`yt${g}`}
          x={padL - 8}
          y={yPx(tv) + 3}
          textAnchor="end"
          fontSize={10}
          fill="#64748b"
        >
          ${tv.toFixed(2)}
        </text>
      );
    }

    elements.push(
      <line
        key="diag"
        x1={xPx(0)}
        y1={yPx(0)}
        x2={xPx(xMax)}
        y2={yPx(yMax)}
        stroke="#0369a1"
        strokeDasharray="5 3"
        strokeWidth={1.5}
      />
    );
    elements.push(
      <text
        key="diaglbl"
        x={xPx(xMax * 0.7)}
        y={yPx(xMax * 0.7) - 6}
        fontSize={10}
        fill="#0369a1"
        fontWeight={600}
      >
        fair price line
      </text>
    );

    result.scatter.forEach((p, i) => {
      elements.push(
        <circle
          key={`pt${i}`}
          cx={xPx(p.trueVal)}
          cy={yPx(p.pricePaid)}
          r={3}
          fill={p.overpriced ? '#ef4444' : '#10b981'}
          fillOpacity={0.55}
          stroke="none"
        />
      );
    });

    elements.push(
      <line
        key="xa"
        x1={padL}
        y1={padT + innerH}
        x2={padL + innerW}
        y2={padT + innerH}
        stroke="#94a3b8"
      />
    );
    elements.push(<line key="ya" x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#94a3b8" />);

    elements.push(
      <text
        key="xlbl"
        x={padL + innerW / 2}
        y={Hgt - 8}
        textAnchor="middle"
        fontSize={11}
        fill="#475569"
      >
        true value (truePCTR × bid)
      </text>
    );
    elements.push(
      <text
        key="ylbl"
        transform={`rotate(-90, ${padL - 42}, ${padT + innerH / 2})`}
        x={padL - 42}
        y={padT + innerH / 2}
        textAnchor="middle"
        fontSize={11}
        fill="#475569"
      >
        price advertiser pays
      </text>
    );

    elements.push(
      <g key="legend" transform={`translate(${padL + 10}, ${padT + 10})`}>
        <circle cx={5} cy={5} r={4} fill="#ef4444" fillOpacity={0.7} />
        <text x={14} y={9} fontSize={11} fill="#475569">
          Overpaid (above diagonal)
        </text>
        <circle cx={150} cy={5} r={4} fill="#10b981" fillOpacity={0.7} />
        <text x={159} y={9} fontSize={11} fill="#475569">
          Underpaid
        </text>
      </g>
    );

    return elements;
  };

  const revenueDelta = result.meanCalib > 0 ? (result.meanMis - result.meanCalib) / result.meanCalib : 0;

  const commentary = (() => {
    if (Math.abs(calibFactor - 1.0) < 0.05) {
      return (
        <>
          Predictions match true pCTR — the auction sets fair prices, advertisers pay what
          impressions are worth, and the publisher earns the calibrated expected revenue. Push the
          calibration multiplier away from 1.0 to reproduce the production failure mode.
        </>
      );
    }
    if (calibFactor > 1.0) {
      return (
        <>
          The model over-predicts pCTR by {((calibFactor - 1) * 100).toFixed(0)}% — every winning
          auction is over-priced, advertisers spend{' '}
          <strong>${result.meanOverpricing.toFixed(3)}</strong> more per impression than the
          impression is worth, and the wrong winner is picked in{' '}
          {(result.wrongWinnerRate * 100).toFixed(0)}% of auctions. Quarter over quarter, this is
          how advertiser ROI collapses and budgets get pulled.
        </>
      );
    }
    return (
      <>
        The model under-predicts pCTR — auctions clear at <strong>too low</strong> a price. The
        publisher leaves money on the table while advertisers get bargains. Less catastrophic than
        over-prediction but still a calibration failure. Calibrate or pay the cost.
      </>
    );
  })();

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · GSP auction × pCTR miscalibration</p>
      <h4 className={styles.heading}>How a calibration error becomes a revenue loss</h4>
      <p className={styles.subheading}>
        {result.N_auctions} synthetic auctions, each with {adsPerAuction} eligible ads. Ads have
        true pCTR and bids; the ranker scores by{' '}
        <code style={{ fontSize: '0.85em' }}>predicted_pCTR × bid</code> and runs a generalised
        second-price auction. Toggle the calibration multiplier and watch how the wrong winner is
        picked — and what advertisers end up paying.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>pCTR calibration multiplier</label>
          <input
            className={styles.slider}
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={calibFactor}
            onChange={(e) => setCalibFactor(parseFloat(e.target.value))}
          />
          <span className={styles.controlValue}>{calibFactor.toFixed(2)}×</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Ads per auction</label>
          <input
            className={styles.slider}
            type="range"
            min={3}
            max={15}
            step={1}
            value={adsPerAuction}
            onChange={(e) => setAdsPerAuction(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{adsPerAuction}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Synthetic data seed</label>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={100}
            step={1}
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{seed}</span>
        </div>
      </div>

      <div className={styles.outputs}>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Revenue / auction (calibrated)</p>
          <p className={styles.outputValue}>${result.meanCalib.toFixed(3)}</p>
          <p className={styles.outputSubtext}>baseline · honest pricing</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            revenueDelta < -0.05 ? styles.outputItemAlert : ''
          } ${Math.abs(revenueDelta) < 0.02 ? styles.outputItemOk : ''}`}
        >
          <p className={styles.outputLabel}>Revenue / auction (live)</p>
          <p className={styles.outputValue}>${result.meanMis.toFixed(3)}</p>
          <p className={styles.outputSubtext}>
            {revenueDelta >= 0 ? '+' : ''}
            {(revenueDelta * 100).toFixed(1)}% vs calibrated
          </p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.meanOverpricing > 0.02 ? styles.outputItemAlert : ''
          }`}
        >
          <p className={styles.outputLabel}>Mean overpricing</p>
          <p className={styles.outputValue}>
            ${result.meanOverpricing >= 0 ? '+' : ''}
            {result.meanOverpricing.toFixed(3)}
          </p>
          <p className={styles.outputSubtext}>advertiser ROI hit</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.wrongWinnerRate > 0.15 ? styles.outputItemAlert : ''
          }`}
        >
          <p className={styles.outputLabel}>Wrong winner rate</p>
          <p className={styles.outputValue}>{(result.wrongWinnerRate * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>vs calibrated outcome</p>
        </div>
      </div>

      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${Hgt}`}
        role="img"
        aria-label="Scatter plot of price paid vs true value across N auctions"
      >
        {renderScatter()}
      </svg>

      <p className={styles.commentary}>{commentary}</p>

      <div
        style={{
          marginTop: '0.8rem',
          padding: '0.7rem 0.95rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontSize: '0.82rem',
          color: '#475569',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: '#0f172a' }}>GSP price formula:</strong>{' '}
        <code>price_per_click = score_next / pCTR_winner</code>. The winner pays just enough to
        outbid the next ad, divided by their pCTR. When pCTR is wrong, this division produces
        wrong prices — the central economic identity of ad ranking, and why calibration is{' '}
        <strong>mandatory</strong> at this layer.
      </div>
    </div>
  );
}
