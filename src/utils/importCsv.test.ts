import { describe, expect, it } from 'vitest';
import { analyzeCSVDateOverlap, analyzeCSVImport, parseCSVData } from './importCsv';

describe('CSV import', () => {
  it('detects imported results that fall on calendar dates already containing data', () => {
    const timestamp = (day: number, hour: number) => new Date(2026, 6, day, hour, 0, 0).toISOString();
    const overlap = analyzeCSVDateOverlap(
      [
        { timestamp: timestamp(21, 8) },
        { timestamp: timestamp(21, 20) },
        { timestamp: timestamp(23, 8) },
      ],
      [
        { timestamp: timestamp(21, 9) },
        { timestamp: timestamp(22, 9) },
      ]
    );

    expect(overlap).toEqual({
      overlappingDateCount: 1,
      overlappingReadingCount: 2,
    });
  });

  it('keeps compatibility with the native exported format', () => {
    const csv = [
      'sep=;',
      '# Referencia de clasificación: Europea ESC 2024',
      'Fecha;Hora;Sistolica_mmHg;Diastolica_mmHg;Pulsaciones_ppm;Brazo;Contexto_Medicacion;Clasificacion_PA;Tomas_En_Sesion;Tomas_Descartadas;Notas;Presion_Pulso_mmHg;Valor_Causante;Presion_Pulso_Confirmada;Avisos_Informativos',
      '21/07/2026;08:30;128;78;67;Derecho;true;;1;0;"Antes del desayuno";50;;false;',
    ].join('\n');

    const result = analyzeCSVImport(csv);

    expect(result.format).toBe('native');
    expect(result.nativeSource).toBe('historical-report');
    expect(result.reportedSourceReadings).toBe(1);
    expect(result.reportedMultiReadingSessions).toBe(0);
    expect(result.reportedDiscardedReadings).toBe(0);
    expect(result.readings).toHaveLength(1);
    expect(result.readings[0]).toMatchObject({
      systolic: 128,
      diastolic: 78,
      heartRate: 67,
      arm: 'right',
      notes: 'Antes del desayuno',
      takesAntihypertensiveMedication: true,
    });
    expect(parseCSVData(csv)).toEqual(result.readings);
  });

  it('identifies current CSV reports and quantifies the original readings that cannot be rebuilt', () => {
    const csv = [
      'sep=;',
      '# Tipo de archivo: informe CSV; no es una copia de seguridad',
      'Fecha;Hora;Sistolica_mmHg;Diastolica_mmHg;Pulsaciones_ppm;Brazo;Contexto_Medicacion;Clasificacion_PA;Tomas_En_Sesion;Tomas_Descartadas;Tipo_Resultado;Notas',
      '21/07/2026;08:30;132;82;70;Derecho;true;;3;1;"Media filtrada";"Antes del desayuno"',
      '22/07/2026;08:35;126;76;65;Derecho;true;;1;0;"Medición individual";',
    ].join('\n');

    const result = analyzeCSVImport(csv);

    expect(result.format).toBe('native');
    expect(result.nativeSource).toBe('current-report');
    expect(result.readings).toHaveLength(2);
    expect(result.reportedSourceReadings).toBe(4);
    expect(result.reportedMultiReadingSessions).toBe(1);
    expect(result.reportedDiscardedReadings).toBe(1);
  });

  it('detects MyTherapy and rebuilds multiple readings from positional components', () => {
    const csv = [
      'actual_date,scheduled_date,type,name,value,unit,status,note',
      '2019-01-07 18:20:00,,measurement,Presión arterial sistólica,110.00,mmHg,confirmed,"Primera, en reposo"',
      '2019-01-07 18:20:00,,measurement,Presión arterial sistólica,129.00,mmHg,confirmed,Segunda',
      '2019-01-07 18:20:00,,measurement,Presión arterial diastólica,75.00,mmHg,confirmed,',
      '2019-01-07 18:20:00,,measurement,Presión arterial diastólica,76.00,mmHg,confirmed,',
      '2019-01-07 18:20:00,,measurement,Frecuencia cardíaca en reposo,79.00,lpm,confirmed,',
      '2019-01-07 18:20:00,,measurement,Frecuencia cardíaca en reposo,82.00,lpm,confirmed,',
      '2019-01-11 20:30:00,,measurement,Peso,85.40,kg,confirmed,',
      '2019-01-22 16:07:26,,lab value,Colesterol,165.00,mg/dL,confirmed,',
    ].join('\n');

    const result = analyzeCSVImport(csv, { defaultArm: 'right' });

    expect(result.format).toBe('mytherapy');
    expect(result.readings).toHaveLength(2);
    expect(result.ignoredRows).toBe(2);
    expect(result.invalidReadings).toBe(0);
    expect(result.incompleteGroups).toBe(0);
    expect(result.readings[0]).toMatchObject({
      systolic: 110,
      diastolic: 75,
      heartRate: 79,
      arm: 'right',
      notes: 'Primera, en reposo',
    });
    expect(result.readings[1]).toMatchObject({
      systolic: 129,
      diastolic: 76,
      heartRate: 82,
      notes: 'Segunda',
    });
    const localDate = new Date(result.readings[0].timestamp);
    expect([localDate.getFullYear(), localDate.getMonth() + 1, localDate.getDate()]).toEqual([2019, 1, 7]);
    expect([localDate.getHours(), localDate.getMinutes()]).toEqual([18, 20]);
    expect(new Date(result.readings[1].timestamp).getTime() - localDate.getTime()).toBe(1000);
  });

  it('normalizes shorthand only when it produces a valid complete measurement', () => {
    const csv = [
      'actual_date,scheduled_date,type,name,value,unit,status,note',
      '2024-08-12 07:21:22,,measurement,Presión arterial sistólica,12.00,mmHg,confirmed,',
      '2024-08-12 07:21:22,,measurement,Presión arterial diastólica,8.00,mmHg,confirmed,',
      '2024-08-12 07:21:22,,measurement,Frecuencia cardíaca en reposo,7.00,lpm,confirmed,',
      '2025-02-04 08:10:59,,measurement,Presión arterial sistólica,126.00,mmHg,confirmed,',
      '2025-02-04 08:10:59,,measurement,Presión arterial diastólica,8.00,mmHg,confirmed,',
      '2025-02-04 08:10:59,,measurement,Frecuencia cardíaca en reposo,77.00,lpm,confirmed,',
    ].join('\n');

    const result = analyzeCSVImport(csv);

    expect(result.readings).toHaveLength(2);
    expect(result.shorthandNormalized).toBe(2);
    expect(result.invalidReadings).toBe(0);
    expect(result.readings[0]).toMatchObject({ systolic: 120, diastolic: 80, heartRate: 70 });
    expect(result.readings[1]).toMatchObject({ systolic: 126, diastolic: 80, heartRate: 77 });
  });

  it('rejects incomplete groups and unconfirmed components without guessing', () => {
    const csv = [
      'actual_date,scheduled_date,type,name,value,unit,status,note',
      '2026-07-01 08:00:00,,measurement,Presión arterial sistólica,125.00,mmHg,confirmed,',
      '2026-07-01 08:00:00,,measurement,Presión arterial diastólica,75.00,mmHg,confirmed,',
      '2026-07-01 08:00:00,,measurement,Frecuencia cardíaca en reposo,65.00,lpm,rejected,',
    ].join('\n');

    const result = analyzeCSVImport(csv);

    expect(result.format).toBe('mytherapy');
    expect(result.readings).toHaveLength(0);
    expect(result.ignoredRows).toBe(1);
    expect(result.incompleteGroups).toBe(1);
    expect(result.invalidReadings).toBe(1);
  });
});
