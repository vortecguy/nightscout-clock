// Glucose graph on the left, then the value and the trend arrow, with age dots under them.
#ifndef BGDISPLAYFACEGRAPHARROW_H
#define BGDISPLAYFACEGRAPHARROW_H

#include "BGDisplayFaceGraphBase.h"
#include "BGDisplayFaceTextBase.h"
#include "BGDisplayFaceWithAge.h"

class BGDisplayFaceGraphArrow : public BGDisplayFaceGraphBase,
                                public BGDisplayFaceTextBase,
                                public BGDisplayFaceWithAge {
public:
    void showReadings(const GlucoseReadings& readings, bool dataIsOld = false) const override;
};

#endif  // BGDISPLAYFACEGRAPHARROW_H
