#include "BGDisplayFaceGraphArrow.h"

#include <Arduino.h>

#include "globals.h"

namespace {

// The arrow is 5 columns wide at the right edge, with one blank column before it.
const int16_t ARROW_X = MATRIX_WIDTH - 5;
// The value is printed right-aligned to this cursor position. Every glyph's advance includes one blank
// column, so the value's last lit column is ARROW_X - 2 and ARROW_X - 1 stays blank.
const int16_t VALUE_RIGHT = ARROW_X;
// Readings come every 5 minutes; a column narrower than that would leave gaps in the graph.
const uint16_t MIN_MINUTES_PER_COLUMN = 5;

}  // namespace

void BGDisplayFaceGraphArrow::showReadings(const GlucoseReadings& readings, bool dataIsOld) const {
    const GlucoseReading lastReading = readings.back();
    const String printableReading = getPrintableReading(lastReading.sgv);

    DisplayManager.setFont(FONT_TYPE::MEDIUM);
    const int16_t textWidth = DisplayManager.getTextWidth(printableReading.c_str(), 2);
    const int16_t valueX = VALUE_RIGHT - textWidth;
    // One blank column between the graph and the value.
    const int16_t graphWidth = valueX - 1;

    if (graphWidth > 0) {
        uint16_t minutesToShow = SettingsManager.settings.face_graph_arrow.span_hours * 60;
        if (minutesToShow < graphWidth * MIN_MINUTES_PER_COLUMN) {
            minutesToShow = graphWidth * MIN_MINUTES_PER_COLUMN;
        }
        showGraph(0, graphWidth, minutesToShow, readings);
    }

    showReading(lastReading, VALUE_RIGHT, 6, TEXT_ALIGNMENT::RIGHT, FONT_TYPE::MEDIUM, dataIsOld);
    showTrendArrow(lastReading, ARROW_X, 1, dataIsOld);
    // Age dots on the bottom row, under the value and the arrow.
    drawTimerBlocks(lastReading, MATRIX_WIDTH - graphWidth, graphWidth, 7);
}
