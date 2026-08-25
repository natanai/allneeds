from pathlib import Path

magnet_path = Path('src/components/magnets/MagnetBoard.tsx')
text = magnet_path.read_text()

old_constants = """const LIFTED_CLEARANCE = 54;\nconst LIFTED_ESCAPE_BASE_SPEED = 96;\nconst LIFTED_ESCAPE_APPROACH_SPEED = 144;\nconst LIFTED_ESCAPE_ACCELERATION = 920;\nconst LIFTED_NEIGHBOR_MAX_SPEED = 220;"""
new_constants = """const LIFTED_PRESSURE_REACH = 1.9;\nconst LIFTED_PRESSURE_ACCELERATION = 1450;\nconst LIFTED_PRESSURE_APPROACH_GAIN = 0.7;\nconst LIFTED_SURFACE_COUPLING = 0.34;"""
if text.count(old_constants) != 1:
    raise SystemExit('Current lifted constants no longer match expected source')
text = text.replace(old_constants, new_constants, 1)

old_lifted_flag = """        const liftedId = dragRef.current?.id ?? null;\n        const hasLiftedMagnet = liftedId !== null;"""
if text.count(old_lifted_flag) != 1:
    raise SystemExit('Lifted-state flag block changed unexpectedly')
text = text.replace(old_lifted_flag, "        const liftedId = dragRef.current?.id ?? null;", 1)

old_avoidance = """              const reachX = (lifted.width + resting.width) / 2 + LIFTED_CLEARANCE;\n              const reachY = (lifted.height + resting.height) / 2 + LIFTED_CLEARANCE;\n              const scaledDistance = Math.hypot(clearX / Math.max(reachX, 1), clearY / Math.max(reachY, 1));\n              if (scaledDistance < 1) {\n                const influence = (1 - scaledDistance) ** 1.2;\n                const normalX = clearX / clearDistance;\n                const normalY = clearY / clearDistance;\n                const approachSpeed = Math.max(\n                  lifted.vx * normalX + lifted.vy * normalY,\n                  0,\n                );\n                const approachBoost = clamp(approachSpeed / 360, 0, 1);\n                const targetEscapeSpeed = (\n                  LIFTED_ESCAPE_BASE_SPEED\n                  + LIFTED_ESCAPE_APPROACH_SPEED * approachBoost\n                ) * influence;\n                const outwardSpeed = resting.vx * normalX + resting.vy * normalY;\n                const speedGain = clamp(\n                  targetEscapeSpeed - outwardSpeed,\n                  0,\n                  LIFTED_ESCAPE_ACCELERATION * step,\n                );\n                resting.vx += normalX * speedGain;\n                resting.vy += normalY * speedGain;\n                kickWobble(resting, influence * (7 + approachBoost * 7) * step);\n              }\n              continue;"""
new_avoidance = """              const reachX = Math.max(\n                ((lifted.width + resting.width) / 2) * LIFTED_PRESSURE_REACH,\n                1,\n              );\n              const reachY = Math.max(\n                ((lifted.height + resting.height) / 2) * LIFTED_PRESSURE_REACH,\n                1,\n              );\n              const scaledDistance = Math.hypot(clearX / reachX, clearY / reachY);\n              if (scaledDistance < 1) {\n                const influence = (1 - scaledDistance) ** 1.15;\n                const normalX = clearX / clearDistance;\n                const normalY = clearY / clearDistance;\n                const approachSpeed = Math.max(\n                  lifted.vx * normalX + lifted.vy * normalY,\n                  0,\n                );\n                const approachMultiplier = 1 + (\n                  clamp(approachSpeed / MAX_POINTER_SPEED, 0, 1)\n                  * LIFTED_PRESSURE_APPROACH_GAIN\n                );\n                const pressureAcceleration = (\n                  LIFTED_PRESSURE_ACCELERATION\n                  * influence\n                  * approachMultiplier\n                ) / Math.max(resting.mass, 0.5);\n                resting.vx += normalX * pressureAcceleration * step;\n                resting.vy += normalY * pressureAcceleration * step;\n                kickWobble(resting, influence * approachMultiplier * 14 * step);\n              }\n              continue;"""
if text.count(old_avoidance) != 1:
    raise SystemExit('Lifted avoidance block changed unexpectedly')
text = text.replace(old_avoidance, new_avoidance, 1)

old_suppression = """\n            // While a magnet is above the surface, resting magnets stay in a\n            // viscous layer. Their tiny avoidance motion must not cascade\n            // through a tightly packed row as a chain of hard contacts.\n            if (hasLiftedMagnet) continue;\n\n            const falloff = distance < SURFACE_RADIUS ? (1 - distance / SURFACE_RADIUS) ** 2 : 0;\n\n            if (falloff > 0) {\n              const aSpeed = Math.hypot(a.vx, a.vy);\n              const bSpeed = Math.hypot(b.vx, b.vy);\n              if (aSpeed > 45 && !b.dragging) {\n                const transfer = falloff * SURFACE_COUPLING * step;"""
new_suppression = """\n            // A held magnet sits above the board, but every resting magnet stays\n            // in the same surface physics layer. Pressure applied under the held\n            // magnet can therefore propagate through coupling and hard contacts.\n            const falloff = distance < SURFACE_RADIUS ? (1 - distance / SURFACE_RADIUS) ** 2 : 0;\n            const surfaceCoupling = liftedId === null\n              ? SURFACE_COUPLING\n              : LIFTED_SURFACE_COUPLING;\n\n            if (falloff > 0) {\n              const aSpeed = Math.hypot(a.vx, a.vy);\n              const bSpeed = Math.hypot(b.vx, b.vy);\n              if (aSpeed > 45 && !b.dragging) {\n                const transfer = falloff * surfaceCoupling * step;"""
if text.count(old_suppression) != 1:
    raise SystemExit('Lifted resting-layer suppression block changed unexpectedly')
text = text.replace(old_suppression, new_suppression, 1)

old_second_transfer = """              if (bSpeed > 45 && !a.dragging) {\n                const transfer = falloff * SURFACE_COUPLING * step;"""
new_second_transfer = """              if (bSpeed > 45 && !a.dragging) {\n                const transfer = falloff * surfaceCoupling * step;"""
if text.count(old_second_transfer) != 1:
    raise SystemExit('Second surface transfer block changed unexpectedly')
text = text.replace(old_second_transfer, new_second_transfer, 1)

old_cap = """\n        if (hasLiftedMagnet) {\n          magnets.forEach((magnet) => {\n            if (magnet.dragging || magnet.id === liftedId) return;\n            const limited = limitVector(magnet.vx, magnet.vy, LIFTED_NEIGHBOR_MAX_SPEED);\n            magnet.vx = limited.x;\n            magnet.vy = limited.y;\n          });\n        }\n"""
if text.count(old_cap) != 1:
    raise SystemExit('Lifted neighbor speed cap changed unexpectedly')
text = text.replace(old_cap, '\n', 1)

obsolete = [
    'LIFTED_CLEARANCE',
    'LIFTED_ESCAPE_BASE_SPEED',
    'LIFTED_ESCAPE_APPROACH_SPEED',
    'LIFTED_ESCAPE_ACCELERATION',
    'LIFTED_NEIGHBOR_MAX_SPEED',
    'hasLiftedMagnet',
]
for token in obsolete:
    if token in text:
        raise SystemExit(f'Obsolete lifted-scurry token still remains: {token}')
magnet_path.write_text(text)

spec_path = Path('tests/e2e/magnet-surface-interactions.spec.ts')
spec = spec_path.read_text()
old_name = "test('a dragged magnet makes a nearby resting magnet dodge out of its path', async ({ page }) => {"
new_name = "test('a held magnet pushes its local surface neighbors out of its path', async ({ page }) => {"
if spec.count(old_name) != 1:
    raise SystemExit('Existing desktop scurry test name changed unexpectedly')
spec = spec.replace(old_name, new_name, 1)

addition = r'''

test.describe('mobile held-pressure propagation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pressure from one held magnet propagates through several resting magnets', async ({ page }) => {
    await page.goto('/needs');
    const board = page.getByLabel('Needs magnet board');
    await expect(board).toHaveAttribute('data-ready', 'true');
    await ensurePhysicsOn(board);

    const dragged = board.getByRole('link', { name: 'Control', exact: true });
    await dragged.scrollIntoViewIfNeeded();
    await page.waitForTimeout(520);

    const magnets = board.locator('[data-magnet-id]');
    const before = await magnets.evaluateAll((elements) => elements.map((element) => ({
      id: (element as HTMLElement).dataset.magnetId ?? '',
      x: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-x')),
      y: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-y')),
    })));
    const draggedId = await dragged.getAttribute('data-magnet-id');
    const draggedBox = await dragged.boundingBox();
    expect(draggedBox).not.toBeNull();
    const boardBox = await board.boundingBox();
    expect(boardBox).not.toBeNull();

    const start = {
      x: draggedBox!.x + draggedBox!.width / 2,
      y: draggedBox!.y + draggedBox!.height / 2,
    };
    const target = {
      x: Math.min(start.x + 72, boardBox!.x + boardBox!.width - 34),
      y: start.y,
    };

    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: start.x, y: start.y, id: 1 }],
      });
      for (let step = 1; step <= 18; step += 1) {
        const progress = step / 18;
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{
            x: start.x + (target.x - start.x) * progress,
            y: start.y,
            id: 1,
          }],
        });
        await page.waitForTimeout(18);
      }
      await page.waitForTimeout(520);

      const after = await magnets.evaluateAll((elements) => elements.map((element) => ({
        id: (element as HTMLElement).dataset.magnetId ?? '',
        x: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-x')),
        y: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-y')),
      })));
      const beforeById = new Map(before.map((magnet) => [magnet.id, magnet]));
      const movedRestingMagnets = after.filter((magnet) => {
        if (!magnet.id || magnet.id === draggedId) return false;
        const original = beforeById.get(magnet.id);
        return original ? distance(magnet, original) > 5 : false;
      });

      expect(movedRestingMagnets.length).toBeGreaterThanOrEqual(3);
    } finally {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      }).catch(() => undefined);
      await session.detach();
    }
  });
});
'''
if 'mobile held-pressure propagation' in spec:
    raise SystemExit('Pressure propagation regression already exists')
spec_path.write_text(spec + addition)

doc_path = Path('docs/design-language.md')
doc = doc_path.read_text()
old_design = """**Accepted 2026-08-25.** A magnet being actively held should make nearby resting magnets visibly yield and dodge away as it passes over them, creating a restrained \"scurry out from under it\" response.\n\n- This is an enhancement to the existing physics, not a replacement: preserve pickup alignment, direct drag tracking, fling/release behavior, collisions, wobble, empty-space pushing, persistence, and Play/rest semantics.\n- Avoidance should begin slightly before hard overlap and become more responsive when the held magnet is moving toward another magnet.\n- The dodge must remain plainly visible in the ordinary default packed layout on both desktop and touch devices. It must establish its own outward escape motion rather than depending on the resting collision/repulsion forces to create visible separation.\n- Keep the response controlled rather than explosive: nearby magnets may scurry aside, but the held magnet remains attached to the pointer and avoidance must not cascade into a large chain reaction across the board.\n- Resting magnets remain speed-limited while another magnet is lifted, but the lifted-state cap must be high enough for a nearby magnet to visibly clear the held magnet's path.\n- Pointer pickup is direct manipulation, not a focus treatment. A pointer-held magnet must not acquire an extra focus/selection ring; keyboard focus remains visibly indicated when navigating without pointer pickup. Do not implement this by hiding a held-state focus ring in CSS—prevent pointer pickup from creating/retaining that focus state at the interaction source."""
new_design = """**Accepted 2026-08-25; superseded and expanded 2026-08-25.** A magnet being actively held behaves like a pressure source above the shared magnet surface. Think of lifting it as pushing air down into the board: nearby resting magnets are forced radially away, then their own motion, coupling, and collisions carry that disturbance outward through the packed container.\n\n- This is an enhancement to the existing physics, not a replacement: preserve pickup alignment, direct drag tracking, fling/release behavior, collisions, wobble, empty-space pushing, persistence, and Play/rest semantics.\n- The held magnet remains attached to the pointer and is conceptually above the surface, so resting magnets yield to its pressure rather than pushing the held magnet off the pointer.\n- Pressure reach scales from the physical sizes of the interacting magnets instead of using a separate displacement target. The held interaction applies acceleration/force; normal damping, mass, edge restitution, and collision response dissipate the energy.\n- Do not impose a special held-state speed cap on neighboring magnets. The board is one physics system: while one magnet is held, all resting magnets must continue their ordinary surface coupling and hard-contact response so motion can propagate beyond the first neighbor as a visible ripple through tightly packed magnets.\n- The response should be clearly perceptible on both desktop and touch without becoming an unbounded explosion; tune force, damping, mass, and restitution rather than stopping propagation with an artificial per-neighbor cap or by disabling resting-resting collisions.\n- Pointer pickup is direct manipulation, not a focus treatment. A pointer-held magnet must not acquire an extra focus/selection ring; keyboard focus remains visibly indicated when navigating without pointer pickup. Do not implement this by hiding a held-state focus ring in CSS—prevent pointer pickup from creating/retaining that focus state at the interaction source."""
if doc.count(old_design) != 1:
    raise SystemExit('Current magnet-physics design block changed unexpectedly')
doc = doc.replace(old_design, new_design, 1)
old_decision = """- Held/dragged magnets now establish a visibly stronger outward escape target for nearby magnets so the scurry reads clearly even in the default tightly packed layout on touch and desktop; pointer pickup also clears/suppresses pointer focus at the interaction source so no held-state focus-ring hiding workaround is needed."""
new_decision = """- Held magnets now act as pressure sources above a single shared physics surface: local force pushes nearby magnets outward, resting-resting coupling and collisions remain active so the disturbance can ripple through a packed board, and the former lifted-neighbor speed cap/suppression code is removed. Pointer pickup continues to suppress pointer-created focus at the interaction source rather than hiding a held focus ring."""
if doc.count(old_decision) != 1:
    raise SystemExit('Current magnet decision-log entry changed unexpectedly')
doc_path.write_text(doc.replace(old_decision, new_decision, 1))
