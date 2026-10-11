import { DragonConfig, WingType, TailType } from '../types/game';

export interface DragonRenderState {
  x: number;
  y: number;
  angle: number;
  weight: number;
  segments: { x: number; y: number; angle: number }[];
  isBoosting?: boolean;
  wingFlapPhase?: number;
  tiltAngle?: number; // for 3D wardrobe rotate preview
}

export class DragonPainter {
  /**
   * Photorealistic 2.5D Draconic Engine:
   * - Sculpted predatory skull with supraorbital brow ridges, flared jawlines, and serrated ivory fangs
   * - Deep-set menacing reptilian slit eyes with textured iris striations and corneal specular glints
   * - Backward-swept keratin horns with growth rings and ivory bone tips
   * - Overlapping dorsal osteoderm plates & procedural reptilian diamond scale mesh
   * - Segmented transverse ventral scutes (underbelly armor) with cartilage ribs
   * - Articulated leathery wyvern wings with bone phalanges, thumb claws & translucent vascular membranes
   * - Muscular forelimbs with predatory obsidian talons
   * - Barbed aerodynamic tail finishers with razor hook quills
   * - Elemental thermal fissures, smoke breath particles, and dynamic 3D lighting
   */
  public static drawDragon(
    ctx: CanvasRenderingContext2D,
    config: DragonConfig,
    state: DragonRenderState,
    scale: number = 1.0,
    options: { showShadow?: boolean; glow?: boolean } = { showShadow: true, glow: false }
  ) {
    const { x, y, angle, segments } = state;
    // Dynamic dragon size scaling:
    // Starts as a small, nimble hatchling (weight 40 -> baseRadius ~13.5px)
    // As player eats apples, orbs & defeats dragons: smoothly grows ("sammly") into a massive apex beast (weight 2000+ -> baseRadius ~52px)
    const currentWeight = Math.max(35, state.weight || 40);
    const growthProgress = Math.sqrt(Math.max(0, currentWeight - 35));
    const baseRadius = (12.5 + Math.min(39.5, growthProgress * 0.98)) * scale;
    const numSegments = segments.length;
    const wingPhase = state.wingFlapPhase || 0;

    ctx.save();

    // 1. Soft Cinematic Ambient Occlusion Drop Shadow (contact shadow + soft blur)
    if (options.showShadow) {
      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.42)';
      for (let i = numSegments - 1; i >= 0; i -= 2) {
        const seg = segments[i];
        const segRadius = baseRadius * (1 - (i / numSegments) * 0.58);
        ctx.beginPath();
        ctx.ellipse(
          seg.x + 11 * scale,
          seg.y + 17 * scale,
          segRadius * 1.3,
          segRadius * 0.75,
          seg.angle,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      // Head shadow
      ctx.beginPath();
      ctx.ellipse(
        x + 15 * scale,
        y + 19 * scale,
        baseRadius * 1.5,
        baseRadius * 0.95,
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    // 2. Continuous Body Rendering (Tail-to-Neck for natural anatomical plate layering)
    for (let i = numSegments - 1; i >= 0; i--) {
      const seg = segments[i];
      const progress = i / numSegments;
      const taper = 1 - progress * 0.62;
      const segRadius = Math.max(5.8 * scale, baseRadius * taper);

      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);

      // A. Volumetric Cylindrical Torus Base with 3D Spherical Light
      const bodyGrad = ctx.createRadialGradient(
        -segRadius * 0.45,
        -segRadius * 0.5,
        segRadius * 0.08,
        0,
        0,
        segRadius * 1.15
      );
      bodyGrad.addColorStop(0, '#ffffff'); // Specular highlight
      bodyGrad.addColorStop(0.18, config.primaryColor);
      bodyGrad.addColorStop(0.68, config.secondaryColor);
      bodyGrad.addColorStop(0.88, '#1e293b');
      bodyGrad.addColorStop(1, '#020617'); // Dark core rim

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, segRadius * 1.15, segRadius, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. Ventral Underbelly Scutes (Segmented Transverse Armored Plates)
      ctx.save();
      const bellyGrad = ctx.createLinearGradient(0, -segRadius * 0.2, 0, segRadius * 0.7);
      bellyGrad.addColorStop(0, config.bellyColor);
      bellyGrad.addColorStop(0.8, 'rgba(254, 240, 138, 0.85)');
      bellyGrad.addColorStop(1, '#451a03');

      ctx.fillStyle = bellyGrad;
      ctx.beginPath();
      ctx.ellipse(0, segRadius * 0.3, segRadius * 0.74, segRadius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep transverse rib grooves across ventral plates
      ctx.strokeStyle = 'rgba(20, 6, 2, 0.5)';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(-segRadius * 0.48, segRadius * 0.3);
      ctx.lineTo(segRadius * 0.48, segRadius * 0.3);
      ctx.stroke();
      ctx.restore();

      // C. Realistic Reptilian Diamond Scale Overlay
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.4)';
      ctx.lineWidth = 0.9 * scale;
      [-0.42, -0.15, 0.15, 0.42].forEach((ox) => {
        ctx.beginPath();
        ctx.moveTo(ox * segRadius, -segRadius * 0.35);
        ctx.lineTo(ox * segRadius + 2.5 * scale, -segRadius * 0.2);
        ctx.lineTo(ox * segRadius, -segRadius * 0.05);
        ctx.lineTo(ox * segRadius - 2.5 * scale, -segRadius * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      // D. Elemental Thermal Fissures along the Spine (Volcanic embers / ice crystals)
      if (config.element === 'fire' || config.element === 'electric' || config.element === 'royal') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fissureGrad = ctx.createRadialGradient(
          0,
          -segRadius * 0.38,
          1 * scale,
          0,
          -segRadius * 0.38,
          segRadius * 0.52
        );
        fissureGrad.addColorStop(0, '#ffffff');
        fissureGrad.addColorStop(0.25, config.element === 'fire' ? '#ffaa00' : '#38bdf8');
        fissureGrad.addColorStop(0.7, config.element === 'fire' ? '#ef4444' : '#6366f1');
        fissureGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = fissureGrad;
        ctx.beginPath();
        ctx.ellipse(0, -segRadius * 0.38, segRadius * 0.45, segRadius * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // E. Overlapping Armored Dorsal Osteoderm Spines (Swept backward)
      if (i < numSegments - 2) {
        ctx.save();
        const spikeLen = (10 + (1 - progress) * 13) * scale;
        const spikeGrad = ctx.createLinearGradient(0, -segRadius * 0.7, 0, -segRadius - spikeLen);
        spikeGrad.addColorStop(0, '#090d16');
        spikeGrad.addColorStop(0.45, config.secondaryColor);
        spikeGrad.addColorStop(0.85, config.primaryColor);
        spikeGrad.addColorStop(1, '#ffffff'); // Polished keratin tip highlight

        ctx.fillStyle = spikeGrad;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.5 * scale;

        // Realistic curved dragon horn/spine curving backward
        ctx.beginPath();
        ctx.moveTo(-segRadius * 0.22, -segRadius * 0.72);
        ctx.quadraticCurveTo(-segRadius * 0.08, -segRadius - spikeLen * 0.65, -spikeLen * 0.28, -segRadius - spikeLen);
        ctx.quadraticCurveTo(segRadius * 0.08, -segRadius - spikeLen * 0.55, segRadius * 0.22, -segRadius * 0.72);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Edge specular line on spine blade
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.1 * scale;
        ctx.beginPath();
        ctx.moveTo(0, -segRadius * 0.7);
        ctx.lineTo(-spikeLen * 0.28, -segRadius - spikeLen);
        ctx.stroke();
        ctx.restore();
      }

      // F. Muscular Forelimbs with Predatory Talons (Thoracic segment i = 4)
      if (i === 4) {
        this.drawRealisticTalons(ctx, segRadius, scale, config.secondaryColor);
      }

      // G. Massive Articulated Leathery Wings (Mounted at segment i = 2)
      if (config.wings !== 'none' && i === 2) {
        const flapOffset = Math.sin(wingPhase) * 0.48;
        this.drawPhotorealisticWings(
          ctx,
          config.wings,
          segRadius,
          scale,
          flapOffset,
          config.primaryColor,
          config.secondaryColor
        );
      }

      // H. Barbed Aerodynamic Tail Finisher (Last segment i = numSegments - 1)
      if (i === numSegments - 1) {
        this.drawPhotorealisticTail(ctx, config.tail, segRadius, scale, config.secondaryColor);
      }

      ctx.restore();
    }

    // 3. Perfect Realistic Draconic Cranium with Sculpted Snout, Glowing Slit Eyes & Majestic Swept Horns
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const headRadius = baseRadius * 1.25;

    // A. Grand Occipital Crown Horns & Temporal Spines (Drawn behind skull cranium for natural depth)
    this.drawPhotorealisticHorns(ctx, config, headRadius, scale);

    // B. Main Sculpted Dragon Cranium (Aerodynamic predatory reptilian skull with sculpted jaw & brow)
    this.drawSculptedDragonSkull(ctx, config, headRadius, scale);

    // C. Armored Dorsal Nasal Keel & Midline Scute Highlight (Bridge of snout)
    this.drawNasalKeelAndScales(ctx, config, headRadius, scale);

    // D. Razor Ivory Upper Jaw Fangs (Gracefully curved along jawline)
    this.drawBilateralPredatorFangs(ctx, headRadius, scale);

    // E. Twin Flared Nostril Slits with Element Thermal Ember Glow
    this.drawThermalNostrils(ctx, config, headRadius, scale);

    // F. Menacing Draconic Eyes with Deep Brow Ridges & Predatory Slit Pupils
    this.drawPhotorealisticReptileEyes(ctx, headRadius, scale, config.eyeColor);

    // G. Elemental Cranial Runes & Thermal Veins
    this.drawElementalFacialFissures(ctx, config, headRadius, scale);

    // H. Crown Accessory (if equipped)
    if (config.headPieces?.includes('crown')) {
      this.drawCrown(ctx, headRadius, scale);
    }

    // I. Boost Aura Flame / Trail glow
    if (state.isBoosting) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const boostGrad = ctx.createRadialGradient(0, 0, headRadius * 0.4, 0, 0, headRadius * 2.5);
      boostGrad.addColorStop(0, 'rgba(255, 240, 110, 0.9)');
      boostGrad.addColorStop(0.35, 'rgba(255, 100, 25, 0.6)');
      boostGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = boostGrad;
      ctx.beginPath();
      ctx.arc(0, 0, headRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  /**
   * Anatomically Sculpted Dragon Cranium:
   * Sleek aerodynamic predatory wedge silhouette, prominent supraorbital brow flanges,
   * muscular cheek jowls, and 3D volumetric spherical lighting.
   */
  private static drawSculptedDragonSkull(
    ctx: CanvasRenderingContext2D,
    config: DragonConfig,
    headRadius: number,
    scale: number
  ) {
    // 3D Spherical/Cylindrical lighting gradient (Light from upper-left brow angle)
    const skullGrad = ctx.createRadialGradient(
      headRadius * 0.25,
      -headRadius * 0.25,
      headRadius * 0.08,
      0,
      0,
      headRadius * 1.35
    );
    skullGrad.addColorStop(0, '#ffffff'); // Specular highlight on brow & nasal bridge
    skullGrad.addColorStop(0.2, config.primaryColor);
    skullGrad.addColorStop(0.68, config.secondaryColor);
    skullGrad.addColorStop(0.88, '#1e293b');
    skullGrad.addColorStop(1, '#020617'); // Dark occlusion underside shadow

    ctx.fillStyle = skullGrad;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = Math.max(1.3, 2.2 * scale);

    ctx.beginPath();
    // 1. Snout Apex (Slightly rounded predatory tip at front)
    ctx.moveTo(headRadius * 1.16, 0);

    // 2. Left Nostril Flare (-Y)
    ctx.quadraticCurveTo(headRadius * 1.08, -headRadius * 0.22, headRadius * 0.90, -headRadius * 0.28);

    // 3. Left Upper Maxillary Jaw tapering to Brow Notch
    ctx.quadraticCurveTo(headRadius * 0.60, -headRadius * 0.38, headRadius * 0.32, -headRadius * 0.58);

    // 4. Left Supraorbital Brow Ridge (Fierce crest jutting above eye)
    ctx.quadraticCurveTo(headRadius * 0.12, -headRadius * 0.72, -headRadius * 0.22, -headRadius * 0.70);

    // 5. Left Temporal Jowl & Mandible corner (Muscular cheek)
    ctx.quadraticCurveTo(-headRadius * 0.48, -headRadius * 0.65, -headRadius * 0.65, -headRadius * 0.38);

    // 6. Occipital Neck Connection (Base of skull)
    ctx.quadraticCurveTo(-headRadius * 0.75, -headRadius * 0.18, -headRadius * 0.75, 0);

    // 7. Right Occipital Neck Connection (+Y)
    ctx.quadraticCurveTo(-headRadius * 0.75, headRadius * 0.18, -headRadius * 0.65, headRadius * 0.38);

    // 8. Right Temporal Jowl & Mandible corner
    ctx.quadraticCurveTo(-headRadius * 0.48, headRadius * 0.65, -headRadius * 0.22, headRadius * 0.70);

    // 9. Right Supraorbital Brow Ridge
    ctx.quadraticCurveTo(headRadius * 0.12, headRadius * 0.72, headRadius * 0.32, headRadius * 0.58);

    // 10. Right Upper Maxillary Jaw
    ctx.quadraticCurveTo(headRadius * 0.60, headRadius * 0.38, headRadius * 0.90, headRadius * 0.28);

    // 11. Right Nostril Flare back to Snout Apex
    ctx.quadraticCurveTo(headRadius * 1.08, headRadius * 0.22, headRadius * 1.16, 0);

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle Rostral Keratin Scute on Snout Tip (Clean dragon nose crest)
    ctx.save();
    const rostralGrad = ctx.createLinearGradient(headRadius * 1.02, 0, headRadius * 1.25, 0);
    rostralGrad.addColorStop(0, config.secondaryColor);
    rostralGrad.addColorStop(0.6, '#ffffff');
    rostralGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = rostralGrad;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = Math.max(1, 1.4 * scale);

    ctx.beginPath();
    ctx.moveTo(headRadius * 1.05, -headRadius * 0.08);
    ctx.lineTo(headRadius * 1.24, 0);
    ctx.lineTo(headRadius * 1.05, headRadius * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Armored Dorsal Nasal Keel & Diamond Scales along the center of the snout
   */
  private static drawNasalKeelAndScales(
    ctx: CanvasRenderingContext2D,
    config: DragonConfig,
    headRadius: number,
    scale: number
  ) {
    ctx.save();

    // Volumetric central highlight spine along the bridge of the muzzle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(1, 1.8 * scale);
    ctx.beginPath();
    ctx.moveTo(-headRadius * 0.15, 0);
    ctx.lineTo(headRadius * 1.02, 0);
    ctx.stroke();

    // 3 Armored diamond scutes along the dorsal bridge of the snout
    const scuteXs = [0.28, 0.54, 0.78];
    scuteXs.forEach((frac, idx) => {
      const cx = headRadius * frac;
      const sizeX = (6.0 - idx * 0.9) * scale;
      const sizeY = (4.5 - idx * 0.8) * scale;

      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.24)' : 'rgba(2, 6, 23, 0.32)';
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.5)';
      ctx.lineWidth = Math.max(0.8, 1.0 * scale);

      ctx.beginPath();
      ctx.moveTo(cx - sizeX, 0);
      ctx.lineTo(cx, -sizeY);
      ctx.lineTo(cx + sizeX, 0);
      ctx.lineTo(cx, sizeY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Forehead draconic crown diamond jewel / boss
    ctx.fillStyle = config.bellyColor;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.beginPath();
    ctx.moveTo(-headRadius * 0.12, 0);
    ctx.lineTo(headRadius * 0.06, -headRadius * 0.15);
    ctx.lineTo(headRadius * 0.24, 0);
    ctx.lineTo(headRadius * 0.06, headRadius * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Upper Jaw Razor Ivory Fangs:
   * Elegant curved predator canines neatly hugging the jawline contour.
   */
  private static drawBilateralPredatorFangs(
    ctx: CanvasRenderingContext2D,
    headRadius: number,
    scale: number
  ) {
    [-1, 1].forEach((side) => {
      ctx.save();

      // Two sharp ivory canines per side along the upper jaw margin
      const fangs = [
        // Primary Great Fang (anterior)
        {
          bx: headRadius * 0.84,
          by: side * headRadius * 0.26,
          tx: headRadius * 0.82,
          ty: side * headRadius * 0.42,
          w: Math.max(2.2, 4.0 * scale),
        },
        // Secondary Sharp Fang
        {
          bx: headRadius * 0.62,
          by: side * headRadius * 0.34,
          tx: headRadius * 0.60,
          ty: side * headRadius * 0.48,
          w: Math.max(1.8, 3.2 * scale),
        },
      ];

      fangs.forEach((fang) => {
        const fangGrad = ctx.createLinearGradient(fang.bx, fang.by, fang.tx, fang.ty);
        fangGrad.addColorStop(0, '#fef9c3'); // Ivory root
        fangGrad.addColorStop(0.5, '#ffffff'); // Enamel highlight
        fangGrad.addColorStop(1, '#fef08a'); // Razor tip

        ctx.fillStyle = fangGrad;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = Math.max(0.8, 1.2 * scale);

        ctx.beginPath();
        const dx = fang.tx - fang.bx;
        const dy = fang.ty - fang.by;
        const len = Math.hypot(dx, dy) || 1;
        const px = (-dy / len) * (fang.w / 2);
        const py = (dx / len) * (fang.w / 2);

        ctx.moveTo(fang.bx + px, fang.by + py);
        ctx.lineTo(fang.tx, fang.ty);
        ctx.lineTo(fang.bx - px, fang.by - py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // Upper lip contour line
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = Math.max(1, 1.6 * scale);
      ctx.beginPath();
      ctx.moveTo(headRadius * 0.98, side * headRadius * 0.20);
      ctx.quadraticCurveTo(headRadius * 0.68, side * headRadius * 0.36, headRadius * 0.36, side * headRadius * 0.52);
      ctx.stroke();

      ctx.restore();
    });
  }

  /**
   * Twin Flared Nostril Slits with Element Thermal Glow
   */
  private static drawThermalNostrils(
    ctx: CanvasRenderingContext2D,
    config: DragonConfig,
    headRadius: number,
    scale: number
  ) {
    [-1, 1].forEach((side) => {
      ctx.save();
      const nx = headRadius * 0.96;
      const ny = side * headRadius * 0.16;

      // Dark nostril pit
      ctx.fillStyle = '#050811';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = Math.max(0.8, 1.2 * scale);
      ctx.beginPath();
      ctx.ellipse(nx, ny, 3.8 * scale, 2.0 * scale, side * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Soft internal thermal glow
      const emberGrad = ctx.createRadialGradient(nx, ny, 0.4 * scale, nx, ny, 2.6 * scale);
      if (config.element === 'ice') {
        emberGrad.addColorStop(0, '#ffffff');
        emberGrad.addColorStop(0.5, '#38bdf8');
        emberGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else if (config.element === 'electric') {
        emberGrad.addColorStop(0, '#ffffff');
        emberGrad.addColorStop(0.5, '#facc15');
        emberGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      } else {
        emberGrad.addColorStop(0, '#ffffff');
        emberGrad.addColorStop(0.4, '#ff7a18');
        emberGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      }

      ctx.fillStyle = emberGrad;
      ctx.beginPath();
      ctx.arc(nx + 0.4 * scale, ny, 2.4 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  /**
   * Menacing Predatory Dragon Eyes:
   * Almond eye socket set under supraorbital brow, radiant glowing iris,
   * razor vertical slit pupil, and lifelike crystalline specular catchlight glint.
   */
  private static drawPhotorealisticReptileEyes(
    ctx: CanvasRenderingContext2D,
    headRadius: number,
    scale: number,
    eyeColor: string
  ) {
    const eyeOffsetX = headRadius * 0.22;
    const eyeOffsetY = headRadius * 0.38;
    const eyeLen = headRadius * 0.26;
    const eyeWid = headRadius * 0.16;

    [-1, 1].forEach((side) => {
      ctx.save();
      const ey = side * eyeOffsetY;
      const slantAngle = side * 0.22; // Predatory forward tilt

      // 1. Orbital Socket Shadow
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX, ey, eyeLen * 1.2, eyeWid * 1.28, slantAngle, 0, Math.PI * 2);
      ctx.fill();

      // 2. Radiant Dragon Iris
      const irisGrad = ctx.createRadialGradient(
        eyeOffsetX,
        ey,
        eyeWid * 0.08,
        eyeOffsetX,
        ey,
        eyeLen * 0.95
      );
      irisGrad.addColorStop(0, '#ffffff'); // Inner glow
      irisGrad.addColorStop(0.35, eyeColor);
      irisGrad.addColorStop(0.82, eyeColor);
      irisGrad.addColorStop(1, '#020617'); // Limbal outer dark ring

      ctx.fillStyle = irisGrad;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = Math.max(1, 1.4 * scale);

      ctx.beginPath();
      ctx.ellipse(eyeOffsetX, ey, eyeLen * 0.92, eyeWid * 0.84, slantAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3. Iris Radial Striations
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = Math.max(0.6, 0.8 * scale);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(eyeOffsetX + Math.cos(a) * (eyeWid * 0.22), ey + Math.sin(a) * (eyeWid * 0.22));
        ctx.lineTo(eyeOffsetX + Math.cos(a) * (eyeWid * 0.68), ey + Math.sin(a) * (eyeWid * 0.68));
        ctx.stroke();
      }

      // 4. Razor Vertical Slit Pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX + 0.8 * scale, ey, eyeWid * 0.22, eyeWid * 0.82, slantAngle, 0, Math.PI * 2);
      ctx.fill();

      // 5. Crystalline Specular Catchlight Highlights (Lifelike depth)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeOffsetX + 2.4 * scale, ey - side * 2.2 * scale, eyeWid * 0.26, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeOffsetX + 0.6 * scale, ey + side * 1.8 * scale, eyeWid * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // 6. Heavy Supraorbital Bony Brow Arch (Iconic dragon scowl)
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = Math.max(1.8, 3.2 * scale);
      ctx.beginPath();
      ctx.moveTo(eyeOffsetX + headRadius * 0.20, ey - side * (headRadius * 0.04));
      ctx.quadraticCurveTo(
        eyeOffsetX,
        ey - side * (eyeWid * 1.48),
        eyeOffsetX - headRadius * 0.18,
        ey - side * (eyeWid * 0.85)
      );
      ctx.stroke();

      // Brow Arch 3D Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.beginPath();
      ctx.moveTo(eyeOffsetX + headRadius * 0.18, ey - side * (headRadius * 0.06));
      ctx.quadraticCurveTo(
        eyeOffsetX,
        ey - side * (eyeWid * 1.38),
        eyeOffsetX - headRadius * 0.15,
        ey - side * (eyeWid * 0.8)
      );
      ctx.stroke();

      ctx.restore();
    });

    // Furrowed brow wrinkles between eyes
    ctx.save();
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(eyeOffsetX + 3 * scale, side * 2.5 * scale);
      ctx.lineTo(eyeOffsetX - 6 * scale, side * 7 * scale);
      ctx.stroke();
    });
    ctx.restore();
  }

  /**
   * Swept-Back Keratin Dragon Horns with Smooth Arcs & Cheek Spines
   */
  private static drawPhotorealisticHorns(
    ctx: CanvasRenderingContext2D,
    config: DragonConfig,
    headRadius: number,
    scale: number
  ) {
    const isLord = config.headShape === 'lord';
    const isWyrm = config.headShape === 'wyrm';
    const isSerpent = config.headShape === 'serpent';

    [-1, 1].forEach((side) => {
      // 1. Primary Swept Occipital Crown Horns
      ctx.save();
      const hornLength = (isLord ? 1.85 : isSerpent ? 1.45 : 1.65) * headRadius;
      const hornSpread = (isWyrm ? 1.15 : 0.95) * headRadius;

      const hornGrad = ctx.createLinearGradient(
        -headRadius * 0.25,
        side * headRadius * 0.32,
        -hornLength,
        side * hornSpread
      );
      hornGrad.addColorStop(0, '#090d16');
      hornGrad.addColorStop(0.35, config.secondaryColor);
      hornGrad.addColorStop(0.75, isLord ? '#facc15' : config.secondaryColor);
      hornGrad.addColorStop(1, isLord ? '#ffffff' : '#fef08a'); // Gilded / ivory tip

      ctx.fillStyle = hornGrad;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = Math.max(1.2, 2.2 * scale);

      ctx.beginPath();
      // Horn base on occiput
      ctx.moveTo(-headRadius * 0.25, side * headRadius * 0.30);
      // Outer curved sweep
      ctx.quadraticCurveTo(
        -headRadius * 0.95,
        side * (hornSpread * 1.18),
        -hornLength,
        side * hornSpread
      );
      // Inner taper to tip
      ctx.quadraticCurveTo(
        -headRadius * 0.85,
        side * (hornSpread * 0.48),
        -headRadius * 0.42,
        side * headRadius * 0.50
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Keratin Growth Rings (Annuli rings showing dragon age)
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.lineWidth = Math.max(0.8, 1.4 * scale);
      for (let r = 1; r <= 3; r++) {
        const factor = r * 0.24;
        ctx.beginPath();
        ctx.arc(
          -headRadius * (0.35 + factor * (hornLength / headRadius * 0.55)),
          side * headRadius * (0.35 + factor * 0.45),
          Math.max(1.8, (4.2 - r * 0.8) * scale),
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // 2. Secondary Inner Crown Spikes
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = Math.max(0.8, 1.4 * scale);
      ctx.beginPath();
      ctx.moveTo(-headRadius * 0.38, side * headRadius * 0.18);
      ctx.quadraticCurveTo(-headRadius * 0.85, side * headRadius * 0.35, -headRadius * 1.15, side * headRadius * 0.25);
      ctx.quadraticCurveTo(-headRadius * 0.75, side * headRadius * 0.14, -headRadius * 0.48, side * headRadius * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Lateral Cheek Spines / Temporal Horns (Frames the jaw beautifully)
      const cheekGrad = ctx.createLinearGradient(
        -headRadius * 0.15,
        side * headRadius * 0.62,
        -headRadius * 0.65,
        side * headRadius * 0.95
      );
      cheekGrad.addColorStop(0, '#090d16');
      cheekGrad.addColorStop(0.6, config.secondaryColor);
      cheekGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = cheekGrad;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = Math.max(0.8, 1.4 * scale);

      ctx.beginPath();
      ctx.moveTo(-headRadius * 0.15, side * headRadius * 0.62);
      ctx.lineTo(-headRadius * 0.65, side * headRadius * 0.95);
      ctx.lineTo(-headRadius * 0.35, side * headRadius * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });

    // Central Occipital Ridge Quill (Midline crest between the horns)
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(0.8, 1.2 * scale);
    ctx.beginPath();
    ctx.moveTo(-headRadius * 0.52, -2.5 * scale);
    ctx.lineTo(-headRadius * 0.95, 0);
    ctx.lineTo(-headRadius * 0.52, 2.5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Elemental Cranial Runes & Thermal Fissures (Glowing veins across skull & brow)
   */
  private static drawElementalFacialFissures(
    ctx: CanvasRenderingContext2D,
    config: DragonConfig,
    headRadius: number,
    scale: number
  ) {
    if (config.element === 'nature' && config.rarity === 'common') return;

    ctx.save();
    let glowColor = 'rgba(255, 120, 20, 0.75)';
    if (config.element === 'ice') glowColor = 'rgba(56, 189, 248, 0.85)';
    else if (config.element === 'electric') glowColor = 'rgba(250, 204, 21, 0.9)';
    else if (config.element === 'royal') glowColor = 'rgba(253, 224, 71, 0.85)';
    else if (config.element === 'sweet') glowColor = 'rgba(244, 114, 182, 0.85)';

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = Math.max(0.8, 1.4 * scale);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 5 * scale;

    [-1, 1].forEach((side) => {
      // Elemental fissure along lateral snout
      ctx.beginPath();
      ctx.moveTo(headRadius * 0.85, side * headRadius * 0.14);
      ctx.lineTo(headRadius * 0.60, side * headRadius * 0.24);
      ctx.lineTo(headRadius * 0.35, side * headRadius * 0.20);
      ctx.stroke();
    });

    ctx.restore();
  }

  /**
   * Muscular Forelimbs with Sharp Predatory Talons
   */
  private static drawRealisticTalons(
    ctx: CanvasRenderingContext2D,
    segRadius: number,
    scale: number,
    color: string
  ) {
    [-1, 1].forEach((side) => {
      ctx.save();
      const armLen = segRadius * 1.45;

      // Forearm limb
      ctx.fillStyle = color;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.7 * scale;

      ctx.beginPath();
      ctx.moveTo(0, side * segRadius * 0.6);
      ctx.quadraticCurveTo(armLen * 0.5, side * (segRadius + 8 * scale), armLen, side * (segRadius + 15 * scale));
      ctx.lineTo(armLen * 0.7, side * (segRadius + 17 * scale));
      ctx.quadraticCurveTo(armLen * 0.3, side * (segRadius + 6 * scale), -segRadius * 0.3, side * segRadius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3 Curved Black Talons/Claws
      ctx.fillStyle = '#090d16';
      [-1, 0, 1].forEach((clawIdx) => {
        ctx.beginPath();
        const cx = armLen + clawIdx * 4 * scale;
        const cy = side * (segRadius + 16 * scale);
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + 6 * scale, cy + side * 9 * scale, cx + 2 * scale, cy + side * 12 * scale);
        ctx.lineTo(cx - 2 * scale, cy + side * 4 * scale);
        ctx.closePath();
        ctx.fill();
      });

      ctx.restore();
    });
  }

  /**
   * Articulated Leathery Wings with bone phalanges, thumb claw, and flight webbing
   */
  private static drawPhotorealisticWings(
    ctx: CanvasRenderingContext2D,
    wingType: WingType,
    segRadius: number,
    scale: number,
    flapOffset: number,
    primColor: string,
    secColor: string
  ) {
    [-1, 1].forEach((side) => {
      ctx.save();
      const span = segRadius * 3.9;
      const angle = (side * Math.PI) / 2 + side * flapOffset;

      ctx.rotate(angle);

      // Translucent Leathery Wing Webbing with Ambient Gradient
      const memGrad = ctx.createRadialGradient(0, 0, span * 0.12, span * 0.65, 0, span * 1.08);
      memGrad.addColorStop(0, primColor);
      memGrad.addColorStop(0.65, secColor);
      memGrad.addColorStop(0.9, '#1e293b');
      memGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');

      ctx.fillStyle = memGrad;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.4 * scale;

      // Realistic 4-Phalange Scalloped Trailing Edge
      ctx.beginPath();
      ctx.moveTo(0, 0); // Shoulder joint
      ctx.quadraticCurveTo(span * 0.42, -side * 22 * scale, span * 0.88, -side * 18 * scale); // Leading bone (radius)
      ctx.lineTo(span, 0); // Primary finger tip
      ctx.quadraticCurveTo(span * 0.8, side * 16 * scale, span * 0.65, side * 29 * scale); // Scalloped web 1
      ctx.quadraticCurveTo(span * 0.5, side * 26 * scale, span * 0.35, side * 31 * scale); // Scalloped web 2
      ctx.quadraticCurveTo(span * 0.22, side * 25 * scale, span * 0.1, side * 29 * scale); // Scalloped web 3
      ctx.quadraticCurveTo(span * 0.05, side * 17 * scale, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Struts / Arm & Finger Bones
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2.2 * scale;

      // Primary arm bone
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(span * 0.88, -side * 18 * scale);
      ctx.lineTo(span, 0);
      ctx.stroke();

      // Finger rib 2
      ctx.beginPath();
      ctx.moveTo(span * 0.88, -side * 18 * scale);
      ctx.lineTo(span * 0.65, side * 29 * scale);
      ctx.stroke();

      // Finger rib 3
      ctx.beginPath();
      ctx.moveTo(span * 0.42, -side * 22 * scale);
      ctx.lineTo(span * 0.35, side * 31 * scale);
      ctx.stroke();

      // Leathery stretch fold striations
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.35)';
      ctx.lineWidth = 1.2 * scale;
      [0.3, 0.5, 0.7].forEach((f) => {
        ctx.beginPath();
        ctx.moveTo(span * f, 0);
        ctx.lineTo(span * f * 0.85, side * 20 * scale);
        ctx.stroke();
      });

      // Wing Thumb Claw (Alula) at elbow joint
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      ctx.arc(span * 0.88, -side * 18 * scale, 3.2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });
  }

  /**
   * Barbed Aerodynamic Tail Finisher
   */
  private static drawPhotorealisticTail(
    ctx: CanvasRenderingContext2D,
    tailType: TailType,
    segRadius: number,
    scale: number,
    color: string
  ) {
    ctx.save();
    const tailLen = segRadius * 3.3;

    const tailGrad = ctx.createLinearGradient(0, 0, -tailLen, 0);
    tailGrad.addColorStop(0, color);
    tailGrad.addColorStop(0.7, '#0f172a');
    tailGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.2 * scale;

    ctx.beginPath();
    // Barbed dragon spade with swept razor hooks
    ctx.moveTo(-segRadius * 0.8, 0);
    ctx.lineTo(-segRadius - tailLen * 0.35, -tailLen * 0.72);
    ctx.lineTo(-segRadius - tailLen * 0.6, -tailLen * 0.42);
    ctx.lineTo(-segRadius - tailLen, 0);
    ctx.lineTo(-segRadius - tailLen * 0.6, tailLen * 0.42);
    ctx.lineTo(-segRadius - tailLen * 0.35, tailLen * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central fin quill spine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-segRadius * 0.8, 0);
    ctx.lineTo(-segRadius - tailLen * 0.95, 0);
    ctx.stroke();

    ctx.restore();
  }

  private static drawCrown(ctx: CanvasRenderingContext2D, headRadius: number, scale: number) {
    ctx.save();
    ctx.translate(-headRadius * 0.35, 0);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2 * scale;

    const w = headRadius * 0.9;
    const h = headRadius * 0.75;

    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(-w / 2, -h);
    ctx.lineTo(-w / 4, -h * 0.6);
    ctx.lineTo(0, -h * 1.2);
    ctx.lineTo(w / 4, -h * 0.6);
    ctx.lineTo(w / 2, -h);
    ctx.lineTo(w / 2, -h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red Gem in center of crown
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -h * 0.75, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
