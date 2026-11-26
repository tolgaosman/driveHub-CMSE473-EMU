<?php

namespace App\Services;

class ValuationService
{
    /** REQ-5.1 & REQ-5.2: Dynamic market valuation with explainable factors */
    public function calculate(string $make, int $year, int $mileageKm, array $damages): array
    {
        $premiumMakes = ['BMW', 'Mercedes-Benz', 'Audi', 'Mazda'];
        $baseByAge = max(3800, 15500 - (2026 - $year) * 780);
        $brandBonus = in_array($make, $premiumMakes, true) ? 3400 : 1200;
        $baseMarket = (int) (round(($baseByAge + $brandBonus) / 50) * 50);

        $expectedKm = max(15000, (2026 - $year) * 14000);
        $kmDelta = $mileageKm - $expectedKm;
        $mileageAdj = (int) (round((-$kmDelta * 0.015) / 50) * 50);

        $factors = [
            ['label' => "KKTC market baseline ({$make} {$year})", 'deltaGbp' => $baseMarket, 'category' => 'BASE'],
        ];
        if ($mileageAdj !== 0) {
            $factors[] = [
                'label' => 'Mileage index ('.number_format($mileageKm).' km)',
                'deltaGbp' => $mileageAdj,
                'category' => 'MILEAGE',
            ];
        }

        $damageTotal = 0;
        foreach ($damages as $d) {
            if (($d['confirmedByInspector'] ?? true) === false) {
                continue;
            }
            $deduction = (int) ($d['estimatedDeductionGbp'] ?? 200);
            $damageTotal -= $deduction;
            $typeLabel = strtolower(str_replace('_', ' ', (string) ($d['type'] ?? 'damage')));
            $confPct = (int) round(((float) ($d['confidence'] ?? 0.85)) * 100);
            $factors[] = [
                'label' => ($d['panel'] ?? 'Exterior panel')." {$typeLabel} ({$confPct}%)",
                'deltaGbp' => -$deduction,
                'category' => 'DAMAGE',
            ];
        }

        $rawSuggested = max(2500, $baseMarket + $mileageAdj + $damageTotal);
        $suggestedPrice = (int) (round($rawSuggested / 50) * 50);
        $spread = max(250, (int) (round(($suggestedPrice * 0.045) / 50) * 50));

        return [
            'suggestedPrice' => $suggestedPrice,
            'minPrice' => $suggestedPrice - $spread,
            'maxPrice' => $suggestedPrice + $spread,
            'modelVersion' => 'valuation-v1.3',
            'factors' => $factors,
        ];
    }
}

