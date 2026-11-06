import type { Satellite } from '../../types/satellite.ts';

export const LOCAL_SEED_SATELLITES: Satellite[] = [
  // --- Space Stations ---
  {
    noradId: 25544,
    name: 'ISS (ZARYA)',
    intlDesig: '1998-067A',
    tleLine1: '1 25544U 98067A   26310.50000000  .00016717  00000-0  10270-3 0  9993',
    tleLine2: '2 25544  51.6420 180.4560 0004560  85.1230 275.0120 15.49815024479901',
    constellation: 'STATIONS',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 48274,
    name: 'CSS (TIANGONG)',
    intlDesig: '2021-035A',
    tleLine1: '1 48274U 21035A   26310.50000000  .00021430  00000-0  21000-3 0  9997',
    tleLine2: '2 48274  41.4720 120.3540 0005120  70.2100 289.8900 15.58912340198003',
    constellation: 'STATIONS',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },

  // --- Scientific Observatories ---
  {
    noradId: 20580,
    name: 'HST (HUBBLE)',
    intlDesig: '1990-037B',
    tleLine1: '1 20580U 90037B   26310.45000000  .00000850  00000-0  45000-4 0  9994',
    tleLine2: '2 20580  28.4690  75.1200 0002800 120.4500 239.6700 15.09214000890124',
    constellation: 'SCIENCE',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },

  // --- Navigation (GPS) ---
  {
    noradId: 36585,
    name: 'NAVSTAR 66 (USA 213)',
    intlDesig: '2010-022A',
    tleLine1: '1 36585U 10022A   26310.40000000  .00000050  00000-0  00000-0 0  9991',
    tleLine2: '2 36585  55.2400  45.1200 0124500 210.4500 148.1200  2.00561230104502',
    constellation: 'NAVIGATION',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 40294,
    name: 'NAVSTAR 73 (USA 258)',
    intlDesig: '2014-068A',
    tleLine1: '1 40294U 14068A   26310.35000000 -.00000010  00000-0  00000-0 0  9998',
    tleLine2: '2 40294  55.1200 135.4500 0089000 180.1200 179.8800  2.00559800072341',
    constellation: 'NAVIGATION',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },

  // --- Weather Satellites ---
  {
    noradId: 33591,
    name: 'NOAA 19',
    intlDesig: '2009-005A',
    tleLine1: '1 33591U 09005A   26310.50000000  .00000140  00000-0  95000-4 0  9992',
    tleLine2: '2 33591  99.1900 210.4500 0013500  65.1200 295.1200 14.12456000789012',
    constellation: 'WEATHER',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 43013,
    name: 'NOAA 20 (JPSS-1)',
    intlDesig: '2017-073A',
    tleLine1: '1 43013U 17073A   26310.48000000  .00000080  00000-0  55000-4 0  9995',
    tleLine2: '2 43013  98.7100 185.3400 0001200  80.4500 279.6700 14.19567000356701',
    constellation: 'WEATHER',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },

  // --- Starlink Constellation Subset (CelesTrak / SpaceX SupGP) ---
  {
    noradId: 44713,
    name: 'STARLINK-1007',
    intlDesig: '2019-074A',
    tleLine1: '1 44713U 19074A   26310.50000000  .00001850  00000-0  11000-3 0  9990',
    tleLine2: '2 44713  53.0540  42.1230 0001450  90.4500 269.6700 15.06412000278904',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 44714,
    name: 'STARLINK-1008',
    intlDesig: '2019-074B',
    tleLine1: '1 44714U 19074B   26310.50000000  .00001820  00000-0  10800-3 0  9991',
    tleLine2: '2 44714  53.0530  62.5400 0001520  92.1200 268.0100 15.06411500278912',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 44715,
    name: 'STARLINK-1009',
    intlDesig: '2019-074C',
    tleLine1: '1 44715U 19074C   26310.50000000  .00001810  00000-0  10700-3 0  9992',
    tleLine2: '2 44715  53.0550  82.9500 0001480  88.7500 271.3800 15.06411800278925',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 44716,
    name: 'STARLINK-1010',
    intlDesig: '2019-074D',
    tleLine1: '1 44716U 19074D   26310.50000000  .00001830  00000-0  10900-3 0  9993',
    tleLine2: '2 44716  53.0540 103.3600 0001550  91.3400 268.7900 15.06412200278931',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56125,
    name: 'STARLINK-30125',
    intlDesig: '2023-042A',
    tleLine1: '1 56125U 23042A   26310.50000000  .00002150  00000-0  12500-3 0  9996',
    tleLine2: '2 56125  43.0020 145.1200 0001600  85.4500 274.6700 15.06520000084501',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56126,
    name: 'STARLINK-30126',
    intlDesig: '2023-042B',
    tleLine1: '1 56126U 23042B   26310.50000000  .00002140  00000-0  12400-3 0  9997',
    tleLine2: '2 56126  43.0030 165.5400 0001580  87.2100 272.9000 15.06519500084512',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56127,
    name: 'STARLINK-30127',
    intlDesig: '2023-042C',
    tleLine1: '1 56127U 23042C   26310.50000000  .00002160  00000-0  12600-3 0  9998',
    tleLine2: '2 56127  43.0010 185.9500 0001650  84.1000 276.0100 15.06520500084523',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56128,
    name: 'STARLINK-30128',
    intlDesig: '2023-042D',
    tleLine1: '1 56128U 23042D   26310.50000000  .00002130  00000-0  12300-3 0  9999',
    tleLine2: '2 56128  43.0040 206.3600 0001550  86.5500 273.5700 15.06519000084534',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56129,
    name: 'STARLINK-30129',
    intlDesig: '2023-042E',
    tleLine1: '1 56129U 23042E   26310.50000000  .00002150  00000-0  12500-3 0  9991',
    tleLine2: '2 56129  43.0020 226.7800 0001620  85.8000 274.3200 15.06520100084545',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56130,
    name: 'STARLINK-30130',
    intlDesig: '2023-042F',
    tleLine1: '1 56130U 23042F   26310.50000000  .00002120  00000-0  12200-3 0  9992',
    tleLine2: '2 56130  43.0050 247.1900 0001500  88.1000 272.0100 15.06518800084556',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56131,
    name: 'STARLINK-30131',
    intlDesig: '2023-042G',
    tleLine1: '1 56131U 23042G   26310.50000000  .00002170  00000-0  12700-3 0  9993',
    tleLine2: '2 56131  43.0010 267.6000 0001680  83.7500 276.3600 15.06521000084567',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56132,
    name: 'STARLINK-30132',
    intlDesig: '2023-042H',
    tleLine1: '1 56132U 23042H   26310.50000000  .00002140  00000-0  12400-3 0  9994',
    tleLine2: '2 56132  43.0030 288.0200 0001560  86.2000 273.9100 15.06519600084578',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56133,
    name: 'STARLINK-30133',
    intlDesig: '2023-042J',
    tleLine1: '1 56133U 23042J   26310.50000000  .00002150  00000-0  12500-3 0  9995',
    tleLine2: '2 56133  43.0020 308.4300 0001610  85.3000 274.8200 15.06520300084589',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56134,
    name: 'STARLINK-30134',
    intlDesig: '2023-042K',
    tleLine1: '1 56134U 23042K   26310.50000000  .00002130  00000-0  12300-3 0  9996',
    tleLine2: '2 56134  43.0040 328.8400 0001530  87.5000 272.6100 15.06518900084590',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  },
  {
    noradId: 56135,
    name: 'STARLINK-30135',
    intlDesig: '2023-042L',
    tleLine1: '1 56135U 23042L   26310.50000000  .00002160  00000-0  12600-3 0  9997',
    tleLine2: '2 56135  43.0010 349.2600 0001660  84.0500 276.0600 15.06520800084601',
    constellation: 'STARLINK',
    source: 'CELESTRAK',
    updatedAt: Date.now()
  }
];

