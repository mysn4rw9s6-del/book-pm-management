import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Paper from '@mui/material/Paper';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import StarIcon from '@mui/icons-material/Star';
import { tokens } from '../theme';

// ---------------------------------------------------------------------------
// Crowd category definitions.
// Each category is readable without colour alone — an icon + text label
// accompanies every visual indicator.
// ---------------------------------------------------------------------------
const CATEGORIES = {
  low: {
    label: 'Low',
    icon: TrendingFlatIcon,
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.35)',
  },
  medium: {
    label: 'Medium',
    icon: ScheduleIcon,
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.35)',
  },
  high: {
    label: 'High',
    icon: WhatshotIcon,
    color: '#FF3B54',
    bg: 'rgba(255,59,84,0.12)',
    border: 'rgba(255,59,84,0.35)',
  },
};

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// Hours the Tait McKenzie Fitness Centre is open: 6 AM – 11 PM
const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}

function categoryForOccupancy(occupancy) {
  if (occupancy < 40) return 'low';
  if (occupancy < 80) return 'medium';
  return 'high';
}

// ---------------------------------------------------------------------------
// Sample occupancy datasets for the six evaluation test states.
// Each day is an array of { hour, occupancy } slots. A day value of null
// means "no data for this day." The `dataAgeHours` field is the age of
// the data record in hours — values over 24 are treated as outdated.
// Negative occupancy values are treated as invalid.
//
// State 1 & 2 & 3 — Happy / Quiet / Day Change:
//   All days have valid, recent data. Different distributions per day so
//   the Day Change test visibly refreshes both forecasts and highlights.
//
// State 4 — Missing Data:
//   One day has null (no occupancy data at all).
//
// State 5 — Outdated Data:
//   The data is valid but older than 24 hours.
//
// State 6 — Invalid Data:
//   Some slots contain negative occupancy values.
// ---------------------------------------------------------------------------
const TEST_STATES = [
  {
    key: 'happyPath',
    label: '1 · Happy Path',
    description: 'Valid recent data for every day. Hourly forecasts show Low / Medium / High.',
    dataAgeHours: 3,
    days: {
      mon: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('mon', h) })),
      tue: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('tue', h) })),
      wed: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('wed', h) })),
      thu: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('thu', h) })),
      fri: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('fri', h) })),
      sat: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sat', h) })),
      sun: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sun', h) })),
    },
  },
  {
    key: 'quietTime',
    label: '2 · Quiet-Time Tied',
    description: 'Multiple slots share the lowest crowd level — all are highlighted.',
    dataAgeHours: 2,
    days: {
      mon: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('mon', h) })),
      tue: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('tue', h) })),
      wed: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('wed', h) })),
      thu: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('thu', h) })),
      fri: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('fri', h) })),
      sat: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sat', h) })),
      sun: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sun', h) })),
    },
  },
  {
    key: 'dayChange',
    label: '3 · Day Change',
    description: 'Select a different day — forecast and highlighted slots both refresh.',
    dataAgeHours: 4,
    days: {
      mon: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('mon', h) })),
      tue: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('tue', h) })),
      wed: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('wed', h) })),
      thu: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('thu', h) })),
      fri: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('fri', h) })),
      sat: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sat', h) })),
      sun: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sun', h) })),
    },
  },
  {
    key: 'missingData',
    label: '4 · Missing Data',
    description: 'No occupancy data available for the selected day. Shows "Forecast unavailable."',
    dataAgeHours: 1,
    days: {
      mon: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('mon', h) })),
      tue: null,
      wed: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('wed', h) })),
      thu: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('thu', h) })),
      fri: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('fri', h) })),
      sat: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sat', h) })),
      sun: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sun', h) })),
    },
  },
  {
    key: 'outdatedData',
    label: '5 · Outdated Data',
    description: 'Data is older than 24 hours. Guardrail fires — shows "Forecast unavailable."',
    dataAgeHours: 30,
    days: {
      mon: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('mon', h) })),
      tue: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('tue', h) })),
      wed: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('wed', h) })),
      thu: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('thu', h) })),
      fri: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('fri', h) })),
      sat: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sat', h) })),
      sun: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sun', h) })),
    },
  },
  {
    key: 'invalidData',
    label: '6 · Invalid Data',
    description: 'Some slots have negative occupancy. Guardrail fires — shows "Forecast unavailable."',
    dataAgeHours: 2,
    days: {
      mon: HOURS.map((h) => ({ hour: h, occupancy: h === 8 || h === 9 ? -5 : occupancyFor('mon', h) })),
      tue: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('tue', h) })),
      wed: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('wed', h) })),
      thu: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('thu', h) })),
      fri: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('fri', h) })),
      sat: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sat', h) })),
      sun: HOURS.map((h) => ({ hour: h, occupancy: occupancyFor('sun', h) })),
    },
  },
];

// Realistic-ish occupancy patterns for a university gym.
// Mornings are quiet, midday spikes (between classes), evening is busiest.
function occupancyFor(day, hour) {
  const dayIdx = DAY_KEYS.indexOf(day);
  const isWeekend = dayIdx >= 5;
  const peakFactor = isWeekend ? 0.7 : 1.0;

  if (hour <= 7) return Math.round((10 + hour * 3) * peakFactor);
  if (hour <= 10) return Math.round((30 + (hour - 7) * 8) * peakFactor);
  if (hour <= 13) return Math.round((55 + (hour - 10) * 10) * peakFactor);
  if (hour <= 16) return Math.round((60 + (hour - 13) * 5) * peakFactor);
  if (hour <= 19) return Math.round((85 + (hour - 16) * 8) * peakFactor);
  return Math.round((95 - (hour - 19) * 12) * peakFactor);
}

// ---------------------------------------------------------------------------
// Forecast engine — validates data and returns either a list of forecast
// slots or a reason why the forecast is unavailable.
//
// Guardrails (from the PRD):
//   - Occupancy data older than 24 hours → outdated → unavailable
//   - Negative occupancy values → invalid → unavailable
//   - Missing day data (null) → missing → unavailable
//   The app must NEVER present unreliable data as a trustworthy forecast.
// ---------------------------------------------------------------------------
function buildForecast(dayData, dataAgeHours) {
  if (!dayData) {
    return { available: false, reason: 'No occupancy data available for this day.' };
  }
  if (dataAgeHours > 24) {
    return { available: false, reason: 'Occupancy data is outdated (over 24 hours old).' };
  }
  const invalidSlot = dayData.find((slot) => typeof slot.occupancy !== 'number' || slot.occupancy < 0);
  if (invalidSlot) {
    return { available: false, reason: 'Occupancy data contains invalid values.' };
  }

  const slots = dayData.map((slot) => ({
    hour: slot.hour,
    occupancy: slot.occupancy,
    category: categoryForOccupancy(slot.occupancy),
  }));

  // Find the lowest category across all slots for the selected day.
  // All slots tied at that level get highlighted.
  const categoryRank = { low: 0, medium: 1, high: 2 };
  const minRank = Math.min(...slots.map((s) => categoryRank[s.category]));
  const minCategory = Object.keys(categoryRank).find((k) => categoryRank[k] === minRank);
  const quietSlots = slots.filter((s) => s.category === minCategory);

  return { available: true, slots, minCategory, quietSlots };
}

// ---------------------------------------------------------------------------
// CrowdForecast screen — day selector + hourly forecast list with
// highlighted quietest slots. Includes a temporary test-state switcher
// for evaluation (to be removed before student-facing release).
// ---------------------------------------------------------------------------
export default function CrowdForecast() {
  const [stateKey, setStateKey] = useState(TEST_STATES[0].key);
  const [dayIdx, setDayIdx] = useState(0);

  const state = useMemo(
    () => TEST_STATES.find((s) => s.key === stateKey) ?? TEST_STATES[0],
    [stateKey]
  );

  const dayKey = DAY_KEYS[dayIdx];
  const dayData = state.days[dayKey];

  const forecast = useMemo(
    () => buildForecast(dayData, state.dataAgeHours),
    [dayData, state.dataAgeHours]
  );

  const handleStateChange = (_, next) => {
    if (next !== null) setStateKey(next);
  };

  const handleDayChange = (_, next) => {
    if (next !== null) setDayIdx(next);
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
        Crowd Forecast
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tait McKenzie Fitness Centre — plan your visit around quieter times.
      </Typography>

      {/* Day selector */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.12em' }}
        >
          Select a day
        </Typography>
        <ToggleButtonGroup
          value={dayIdx}
          exclusive
          onChange={handleDayChange}
          aria-label="Day selector"
          sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { borderRadius: '10px !important', border: '1px solid', borderColor: 'divider', px: 2 } }}
        >
          {DAY_LABELS.map((label, idx) => (
            <ToggleButton
              key={idx}
              value={idx}
              id={`day-${DAY_KEYS[idx]}`}
              sx={{
                fontSize: '0.72rem',
                '&.Mui-selected': {
                  backgroundColor: tokens.accentDim15,
                  color: tokens.violetBright,
                },
              }}
            >
              {label.slice(0, 3)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Forecast */}
      {forecast.available ? (
        <>
          {/* Quietest time summary */}
          <Card id="quiet-summary" sx={{ mb: 2, borderColor: CATEGORIES[forecast.minCategory].border }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
              <StarIcon sx={{ color: CATEGORIES[forecast.minCategory].color, fontSize: 24 }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Best time{forecast.quietSlots.length > 1 ? 's' : ''} to visit
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {forecast.quietSlots.map((s) => formatHour(s.hour)).join(', ')}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Hourly forecast list */}
          <Card id="forecast-list">
            <CardContent sx={{ py: 1, px: 0 }}>
              {forecast.slots.map((slot, idx) => {
                const cat = CATEGORIES[slot.category];
                const Icon = cat.icon;
                const isQuiet = slot.category === forecast.minCategory;
                return (
                  <Box
                    key={slot.hour}
                    id={`forecast-slot-${slot.hour}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.5,
                      borderBottom: idx < forecast.slots.length - 1 ? `1px solid ${tokens.accentDim12}` : 'none',
                      backgroundColor: isQuiet ? cat.bg : 'transparent',
                      transition: 'background-color 0.2s ease',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: isQuiet ? cat.bg : tokens.accentDim08,
                      },
                    }}
                  >
                    {/* Time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 120 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {formatHour(slot.hour)}
                      </Typography>
                      {isQuiet && (
                        <StarIcon sx={{ fontSize: 16, color: cat.color }} />
                      )}
                    </Box>

                    {/* Category chip — icon + text label, not colour alone */}
                    <Chip
                      icon={<Icon sx={{ fontSize: 16 }} />}
                      label={cat.label}
                      size="small"
                      sx={{
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        letterSpacing: '0.06em',
                        color: cat.color,
                        border: `1px solid ${cat.border}`,
                        backgroundColor: cat.bg,
                        '& .MuiChip-icon': { color: cat.color },
                      }}
                      variant="outlined"
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Forecast unavailable — guardrail state */
        <Card id="forecast-unavailable">
          <CardContent sx={{ py: 5, px: 3, textAlign: 'center' }}>
            <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" sx={{ fontSize: '0.95rem', mb: 1 }}>
              Forecast unavailable
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {forecast.reason}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Legend — explains categories so they're readable without colour */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
        {Object.values(CATEGORIES).map((cat) => {
          const Icon = cat.icon;
          return (
            <Chip
              key={cat.label}
              icon={<Icon sx={{ fontSize: 16 }} />}
              label={cat.label}
              size="small"
              variant="outlined"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                fontSize: '0.7rem',
                color: cat.color,
                border: `1px solid ${cat.border}`,
                '& .MuiChip-icon': { color: cat.color },
              }}
            />
          );
        })}
      </Box>

      {/* Temporary test-state switcher for evaluation */}
      <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography
          variant="subtitle1"
          sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.12em' }}
        >
          Test States — for evaluation only
        </Typography>
        <ToggleButtonGroup
          value={stateKey}
          exclusive
          onChange={handleStateChange}
          aria-label="Crowd forecast test state"
          sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { borderRadius: '10px !important', border: '1px solid', borderColor: 'divider', px: 2 } }}
        >
          {TEST_STATES.map((s) => (
            <ToggleButton
              key={s.key}
              value={s.key}
              id={`test-state-${s.key}`}
              sx={{
                fontSize: '0.7rem',
                '&.Mui-selected': {
                  backgroundColor: tokens.accentDim15,
                  color: tokens.violetBright,
                },
              }}
            >
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: '0.78rem' }}>
          {state.description}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.7rem', opacity: 0.7 }}>
          Remove this panel before releasing to students.
        </Typography>
      </Box>
    </Box>
  );
}
