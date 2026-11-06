# Documento Técnico: Modelo de Propagación Orbital SGP4/SDP4, Supuestos y Limitaciones

> **Proyecto:** Satellite Tracker  
> **Área:** Mecánica Orbital, Astrodinámica y Telecomunicaciones Satelitales  

---

## 1. Introducción y Marco Teórico

El seguimiento en tiempo real y la predicción de visibilidad de vehículos espaciales requieren el modelado preciso de trayectorias en regímenes orbitales que van desde la órbita baja terrestre (**LEO**, $160 - 2.000\text{ km}$), la órbita media (**MEO**, $2.000 - 35.786\text{ km}$) hasta la órbita geoestacionaria (**GEO**, $35.786\text{ km}$).

Para calcular las geoposiciones sin requerir telemetría de enlace descendente permanente, la aplicación móvil implementa el modelo analítico **SGP4** (*Simplified General Perturbations 4*) y **SDP4** (*Simplified Deep Space Perturbations 4*), desarrollado históricamente por el *North American Aerospace Defense Command* (NORAD) y documentado por Spacetrack Report No. 3 (Hoots & Roehrich, 1980) y refinado por David Vallado et al. (AIAA 2006-6753).

---

## 2. Descripción Matemática del Modelo SGP4/SDP4

### 2.1 Elementos Orbitales Medios y Formato TLE / OMM

El modelo toma como entrada un conjunto de elementos orbitales en formato **TLE** (*Two-Line Element Set*) o su equivalente moderno **OMM** (*Orbit Mean-Elements Message*, formato JSON/XML de CCSDS). A diferencia de los elementos keplerianos osculatrices instantáneos, los parámetros TLE son **elementos medios**, calculados removiendo matemáticamente perturbaciones periódicas de corto y largo período mediante una transformación canónica de von Zeipel.

Un TLE contiene:
1. **Época ($t_0$):** Año y día juliano fraccionario del vector de estado.
2. **Inclinación ($i$):** Ángulo entre el plano orbital y el plano ecuatorial terrestre ($0^\circ \le i \le 180^\circ$).
3. **Ascensión Recta del Nodo Ascendente ($\Omega$ / RAAN):** Ángulo en el plano ecuatorial medido desde el punto vernal ($\Upsilon$).
4. **Excentricidad ($e$):** Forma de la elipse ($0$ para circular, $0 < e < 1$ para elíptica).
5. **Argumento del Perigeo ($\omega$):** Ángulo desde el nodo ascendente hasta el punto más cercano a la Tierra.
6. **Anomalía Media ($M$):** Posición angular ficticia del satélite a lo largo de su órbita si se moviera a velocidad angular constante.
7. **Movimiento Medio ($n_0$):** Revoluciones por día ($rev/\text{día}$).
8. **Coeficiente Balístico de Fricción ($B^*$):** Medida del arrastre atmosférico modulado por la relación área/masa del satélite ($R_{\text{Earth}}^{-1}$).

### 2.2 Régimen SGP4 vs. SDP4
- **SGP4 ($T < 225\text{ minutos}$):** Se aplica a satélites en LEO/MEO. Modela principalmente el achatamiento polar de la Tierra y la resistencia atmosférica.
- **SDP4 ($T \ge 225\text{ minutos}$):** Se activa automáticamente para satélites en órbitas profundas (ej. satélites de navegación GPS/GLONASS o geoestacionarios GEO). Incluye términos de resonancia orbital y perturbaciones gravitacionales de tercer cuerpo debidas a la Luna y el Sol.

---

## 3. Fuerzas Físicas y Perturbaciones Modeladas

El modelo analítico SGP4 incorpora perturbaciones analíticas de primer y segundo orden:

1. **Achatamiento Gravitacional Terrestre (Geopotencial No Esférico):**
   - Incorpora los armónicos zonales terrestres **$J_2, J_3$ y $J_4$** del elipsoide de referencia **WGS-72 / WGS-84**.
   - **Precesión nodal secular:** Provoca la rotación del plano orbital alrededor del eje polar terrestre ($\dot{\Omega}$).
   - **Rotación de la línea de ápsides:** Desplaza el perigeo a lo largo de la elipse ($\dot{\omega}$).
2. **Resistencia Atmosférica (Arrastre Aerodinámico):**
   - Modela la disipación de energía mecánica mediante una atmósfera estática de densidad exponencial (modelo de Lane).
   - Genera una aceleración secular en el movimiento medio ($\dot{n}_0 > 0$) y una reducción progresiva del semieje mayor ($a$), causando la caída de altitud.
3. **Perturbaciones Gravitacionales Lunisolares (SDP4):**
   - Atracción gravitacional diferencial de la Luna y el Sol sobre órbitas de gran altitud.

---

## 4. Transformaciones de Coordenadas

El flujo matemático en la aplicación sigue la siguiente cadena de transformaciones estandarizada:

```
[TLE / OMM Record]
       │
       ▼  (SGP4/SDP4 Propagation at UTC Date t)
[Inertial State Vector r_ECI, v_ECI]  (True Equator, Mean Equinox of Date / TEME)
       │
       ▼  (Greenwich Mean Sidereal Time rotation θ_GMST)
[Earth-Centered, Earth-Fixed Vector r_ECEF]
       │
       ├───► [Geodetic Subsatellite Point] (WGS-84: Latitude φ, Longitude λ, Altitude h)
       │
       ▼  (Topocentric Transformation with Observer φ_obs, λ_obs, h_obs)
[South-East-Zenith (SEZ) Coordinate Frame]
       │
       ▼  (Trigonometric Look Angles)
[Azimuth A, Elevation E, Slant Range ρ]
```

### 4.1 De ECI (TEME) a ECEF
La rotación de coordenadas inerciales a coordenadas terrestres fijas utiliza el tiempo sidéreo de Greenwich ($\theta_{\text{GMST}}$):
$$\begin{bmatrix} x_{\text{ECEF}} \\ y_{\text{ECEF}} \\ z_{\text{ECEF}} \end{bmatrix} = \begin{bmatrix} \cos\theta_{\text{GMST}} & \sin\theta_{\text{GMST}} & 0 \\ -\sin\theta_{\text{GMST}} & \cos\theta_{\text{GMST}} & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x_{\text{ECI}} \\ y_{\text{ECI}} \\ z_{\text{ECI}} \end{bmatrix}$$

### 4.2 De ECEF a Ángulos Topocéntricos (Azimut / Elevación)
A partir de la posición del observador geodésico y el satélite en ECEF, se calcula el vector de línea de vista $\vec{\rho} = \vec{r}_{\text{ECEF}} - \vec{R}_{\text{obs}}$. Proyectado en los ejes locales Sur-Este-Cenit (**SEZ**):
$$\text{Azimut } (A) = \text{atan2}(+\rho_E, -\rho_S) \quad (\text{normalizado } 0^\circ \le A < 360^\circ)$$
$$\text{Elevación } (E) = \arcsin\left(\frac{\rho_Z}{\|\vec{\rho}\|}\right) \quad (-90^\circ \le E \le +90^\circ)$$

---

## 5. Supuestos Asumidos

1. **Elipsoide Terrestre WGS-84 / WGS-72:**  
   Se asume un radio ecuatorial terrestre de $R_E = 6378.137\text{ km}$ y un aplanamiento $f = 1 / 298.257223563$.
2. **Propagación Balística Libre:**  
   Se asume que entre la época del TLE y la fecha de cálculo el satélite opera en vuelo inercial no propulsado (sin maniobras de elevación de órbita o desorbitación activa).
3. **Ángulo de Elevación Mínima (Máscara RF):**  
   Para enlaces de telecomunicaciones satelitales se adopta un umbral configurable $\theta_{\min} \in [0^\circ, 25^\circ]$ (por defecto $10^\circ$, siguiendo recomendaciones ITU-R para evitar atenuación troposférica y multitrayecto).

---

## 6. Limitaciones del Modelo

1. **Ausencia de Corrección Atmosférica Fina de Alta Densidad:**  
   SGP4 utiliza un modelo analítico simple de densidad exponencial y no integra modelos empíricos complejos como Jacchia-Roberts, MSIS-00 o DTM, los cuales consideran el calentamiento atmosférico provocado por el flujo solar de radio a $10.7\text{ cm}$ ($F_{10.7}$) y el índice geomagnético $A_p / K_p$. En satélites de órbita muy baja como la ISS ($h \approx 420\text{ km}$), tormentas solares pueden alterar el arrastre real produciendo una deriva de varios segundos a lo largo de semanas.
2. **Envejecimiento del TLE (Decaimiento Temporal de la Época):**  
   Los elementos orbitales medios están optimizados para reproducir la órbita en las proximidades de la época $t_0$. Si un TLE supera una antigüedad de 72 a 120 horas en satélites LEO, el error en la posición en la dirección de vuelo (*in-track*) puede acumular decenas de kilómetros. Para Starlink y la ISS, se requiere refresco diario (TTL de 12-24 h).
3. **Maniobras Orbitales No Anunciadas:**  
   Los satélites de la constelación Starlink ejecutan maniobras autónomas frecuentes de prevención de colisiones (*collision avoidance*) y elevación de órbita mediante propulsores iónicos de efecto Hall (Kriptón/Argón). Un TLE propagado pierde validez inmediatamente después de una maniobra de encendido, justificando el uso de efemérides SupGP de SpaceX.
4. **Refracción Troposférica en Ángulos Rasantes:**  
   El cálculo topocéntrico asume propagación en línea recta en el vacío. Para elevaciones extremadamente bajas ($E < 3^\circ$), el índice de refracción atmosférico refracta ópticamente la señal hasta $\sim 0.5^\circ$, lo cual es despreciable para terminales móviles y antenas parabólicas convencionales pero relevante para radioastronomía de alta resolución.

