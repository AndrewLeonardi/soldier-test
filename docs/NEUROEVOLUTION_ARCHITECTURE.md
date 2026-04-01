# Neuroevolution Architecture: How AI Training Works in Toy Soldiers

## The Core Problem

We want every toy soldier to have an "AI brain" that learns skills through training. The player watches the soldier attempt a task (fire rockets, drive a tank, operate a machine gun), fail hilariously, and gradually improve through neuroevolution.

The challenge: making this work reliably across many different weapons and vehicles, each with different physics.

## The Lesson We Learned (The Hard Way)

### What Didn't Work: Pure Neuroevolution

Our first approach was to have the neural net learn everything from scratch:
- **Input**: target position, distance, angle
- **Output**: aim direction, elevation angle, fire trigger
- **Result**: The net got stuck at ~40-55% fitness and plateaued

The problem was fundamental: **we were asking a tiny neural net (92 weights) to rediscover ballistics physics through trial and error.** The correct elevation angle for a rocket to hit a target at distance `d` is a precise mathematical function. Learning this through random weight mutations is like teaching someone calculus before letting them use a calculator.

Specific failure modes we hit:
1. **Spray-and-pray local optimum**: The GA found that "fire constantly while turning" scored ~38% from lucky splash hits. This strategy got reinforced because it occasionally worked.
2. **Elevation plateau**: The net learned ONE elevation value that hit close targets, but couldn't generalize to different distances. A feedforward net with 8 hidden neurons struggled to learn the non-linear distance→elevation mapping.
3. **Exploration penalty death spiral**: When we penalized wasted rockets to discourage spam, brains that didn't fire at all scored better than ones that tried and missed. The GA selected for "do nothing."

### The Breakthrough: NERO-Inspired Hybrid Architecture

The solution came from the [NERO video game research at UT Austin](https://nn.cs.utexas.edu/downloads/papers/stanley.ieeetec05.pdf) — created by Kenneth Stanley, the inventor of the NEAT algorithm. They had the **exact same problem**:

> "Training agents to 'aim by rewarding them for hitting a target' requires 'fine tuning that is slow to evolve.' Their solution was that the 'fire output of neural networks was connected to an **aiming script** that points the gun properly at the enemy closest to the agent's current heading.' Thus, 'agents quickly learn to seek and accurately attack the enemy.'"

**The principle: Script the physics. Let the neural net learn the decisions.**

## The Architecture That Works

### Hybrid Control: Scripted Base + Neural Net Corrections

```
┌─────────────────────────────────────────────────┐
│                   SCRIPTED (FREE)                │
│                                                  │
│  • Auto-face nearest target (angle calculation)  │
│  • Compute ideal elevation (ballistics formula)  │
│  • Fire mechanics (cooldown, projectile spawn)   │
│                                                  │
├─────────────────────────────────────────────────┤
│                NEURAL NET LEARNS                 │
│                                                  │
│  • Aim offset correction (fine-tune angle)       │
│  • Elevation correction (adjust arc)             │
│  • Fire confidence (when to pull trigger)        │
│  • Target selection (which enemy to prioritize)  │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Why This Works

1. **Gen 1 is already "close"**: With scripted aiming + physics, rockets land near targets even with random neural net weights. The corrections are small (±0.2 radians), so random values produce usable results.

2. **Smooth fitness landscape**: Small weight changes produce small aim changes, which produce gradual score improvements. No cliff edges where a tiny change makes everything worse.

3. **The entertainment comes from refinement**: Gen 1 = rockets land close but miss. Gen 10 = starting to hit. Gen 30 = consistent. This progression is fun to watch without being frustratingly random.

4. **Scales to any weapon**: The pattern is always the same — script the hard physics, let the net learn the decisions.

## Ballistics Formula

For a projectile with speed `v` and gravity `g` to hit a target at horizontal distance `d`:

```
θ = 0.5 × arcsin(g × d / v²)
```

Where:
- `θ` = launch elevation angle (radians)
- `g` = gravitational acceleration (9 m/s² in our sim)
- `d` = horizontal distance to target
- `v` = projectile speed (8 units/sec for rockets)

This is computed per-frame and passed to the neural net as an input (the "ideal" elevation), so the net only needs to learn a small correction on top of it.

## Neural Net Architecture

```
Inputs (6):
  [0] Target X position (normalized 0-1)
  [1] Target Z position (normalized -1 to 1)
  [2] Distance to target (normalized 0-1)
  [3] Ideal elevation from ballistics (normalized ~0-1)
  [4] Weapon cooldown (0 = ready, 1 = cooling)
  [5] Targets remaining (normalized 0-1)

Hidden Layer: 12 neurons, tanh activation

Outputs (4):
  [0] Aim offset correction: [-1,1] → [-0.2, 0.2] radians
  [1] Elevation correction: [-1,1] → [-0.15, 0.15] radians
  [2] Fire trigger: > 0 = fire
  [3] (Reserved for future use)

Total weights: (6×12 + 12) + (12×4 + 4) = 136 floats
```

## Genetic Algorithm Settings

```
Population size:     30 individuals
Elites:              6 (top 20% survive unchanged)
Mutation rate:       20% of weights per individual
Mutation strength:   0.6 (gaussian σ), decays 0.98^gen (floor 0.1)
Crossover rate:      35% (uniform crossover)
Selection:           Tournament (k=3)
```

### Adaptive Mutation

Mutation strength decays over generations: `σ = max(0.1, 0.6 × 0.98^gen)`

- **Early generations** (gen 1-10): High mutation = broad exploration
- **Mid generations** (gen 10-30): Moderate mutation = focused refinement
- **Late generations** (gen 30+): Low mutation = fine-tuning

## Fitness Function Design

### Principles

1. **Actual hits dominate**: Each target destroyed = 200 points. This is 10x more than any bonus.
2. **Partial credit for close approaches**: Max ~32 points per near-miss. Enough to guide evolution but never enough to graduate without real hits.
3. **Firing is rewarded**: Small bonus for shooting at all (prevents "do nothing" local optimum).
4. **Accuracy bonus**: Hit rate matters — precision beats spray-and-pray.
5. **Spam penalty only for excess**: Penalty kicks in after 7 rockets, not per miss.

### Current Formula (Rocket Launcher)

```
fitness = destroyed × 200                          // main score
        + Σ (close approach bonus per target)      // max 32 per target
        + min(rockets_fired, 5) × 5               // firing reward
        + (hit_rate × 50)                          // accuracy bonus
        - max(0, rockets_fired - 7) × 10           // spam penalty

normalized = fitness / 1200
graduation_threshold = 0.6 (need ~3-4 hits out of 5 targets)
```

## Scaling to Other Weapons

The hybrid pattern applies to every weapon type:

### Machine Gun
- **Scripted**: Lead calculation (aim ahead of moving target based on bullet speed + target velocity)
- **Net learns**: Burst length, sweep angle, target prioritization, when to stop firing

### Tank
- **Scripted**: Basic pathfinding toward waypoints, turret auto-tracking nearest enemy
- **Net learns**: Route selection, when to stop and fire, positioning decisions

### Jeep (Mounted Gun)
- **Scripted**: Drive along predetermined route, gun auto-aims at nearest target
- **Net learns**: Speed control, when to stop for better aim, evasion patterns

### TNT/Grenades
- **Scripted**: Throw arc calculation (same ballistics formula, different speed/gravity)
- **Net learns**: Range estimation corrections, timing, target selection

## Key References

1. **NERO Video Game (rtNEAT)** — The foundational research on real-time neuroevolution in games. Proved that scripted aiming + evolved decision-making is the right architecture.
   - Paper: https://nn.cs.utexas.edu/downloads/papers/stanley.ieeetec05.pdf

2. **Aim and Shoot** — Browser-based neuroevolution shooting game in JavaScript/Canvas. Demonstrates genetic crossover of neural nets in a shooter context.
   - GitHub: https://github.com/victorqribeiro/aimAndShoot

3. **NeatJS** — JavaScript NEAT implementation with an Asteroids demo showing evolved spaceship AI that learns to shoot asteroids.
   - Demo: https://gabrieltavernini.github.io/NeatJS/
   - Uses 16 raycasting inputs, 4 outputs (forward, left, right, shoot)

4. **Neataptic** — Flexible neuro-evolution library for browser and Node.js. Supports evolving topology (adding/removing neurons and connections).
   - GitHub: https://github.com/wagenaartje/neataptic

5. **Nature of Code: Neuroevolution** — Excellent tutorial on combining genetic algorithms with neural networks in JavaScript.
   - Book: https://natureofcode.com/neuroevolution/

6. **Neuroevolution in Games: State of the Art** — Academic survey covering fitness function design, architecture choices, and common pitfalls.
   - Paper: https://arxiv.org/pdf/1410.7326

## Future Considerations

### NEAT (Evolving Topology)
Our current approach uses a fixed network topology (6→12→4). NEAT starts with zero hidden nodes and evolves the topology over time — adding neurons and connections only when needed. This often finds simpler, more efficient solutions. Consider migrating to a JavaScript NEAT library (NeatJS or Neataptic) if fixed-topology GA continues to plateau on harder tasks.

### Multi-Objective Fitness
For complex weapons (tanks, jeeps), a single fitness score may not capture all desired behaviors. Consider Pareto-based multi-objective evolution where separate scores for accuracy, survival, speed, etc. are evolved simultaneously.

### Transfer Learning
Once a soldier learns one weapon, their brain weights could seed training for a related weapon. A rocket soldier's "fire timing" knowledge might transfer to grenade training. This would make training subsequent skills faster and more entertaining.
