# Model Architecture

**Type of model:** ConvGRU — dataset, data module, network, Lightning module, and trainer.

## How It Works

### Encoder

- Takes several past weather radar images as input.
- Extracts important weather patterns and compresses them into a smaller internal representation (called a latent space).

### ConvGRU Layers

- ConvGRU (Convolutional Gated Recurrent Unit) layers learn how weather changes over time.
- They capture both spatial information (where weather is happening) and temporal information (how it evolves).

### Decoder

- Uses the learned hidden representations to generate future weather radar images.
- Unlike many forecasting models, it predicts future frames directly from the latent representation instead of repeatedly using previous predictions as new inputs. This helps reduce accumulated prediction errors.

### Ensemble Forecasting

- The model can produce multiple forecast scenarios by adding random noise during decoding.
- These multiple predictions estimate the uncertainty of the forecast, making the results more reliable.

## Training Approach

```
 Past Radar Images
        │
        ▼
    Encoder
        │
        ▼
  ConvGRU Layers
 (learn temporal patterns)
        │
        ▼
     Decoder
        │
        ▼
 Future Weather Forecasts
     (1 or many ensembles)
```

## Key Features

- Encoder-decoder architecture for sequence prediction.
- Uses ConvGRU blocks to model both space and time.
- Predicts multiple future time steps from a sequence of past observations.
- Supports probabilistic (ensemble) forecasting for uncertainty estimation.
- Can be replaced with custom neural network architectures through mlcast's configuration system, as long as they follow the required input/output interface.

## Implementation: `ConvGruModel`

`ConvGruModel` (in `src/mlcast/models/convgru.py`) is an encoder-decoder
architecture. It is **not autoregressive at forecast time**: instead of
generating each forecast frame from the previous predicted frame, the decoder
performs the temporal roll-out entirely in **latent space**.

- **Encoding** — a stack of `EncoderBlock` layers unrolls a ConvGRU sequentially
  over the `input_steps` observed frames. Each block halves spatial resolution
  via `PixelUnshuffle(2)`; the last hidden state of each block is retained.
- **Decoding** — a stack of `DecoderBlock` layers performs a latent-space
  roll-out at each spatial scale. Each decoder block's ConvGRU is initialised
  with the final hidden state of the matching encoder block, then unrolls over
  `forecast_steps` driven by noise or zeros. Spatial resolution is doubled at
  each block via `PixelShuffle(2)`. Forecast frames are only materialised at the
  end, never fed back as inputs — which reduces accumulated error.
- **Ensemble** — when `ensemble_size > 1`, the decoder runs `ensemble_size`
  times, each with freshly sampled Gaussian noise; results are concatenated along
  the channel dimension.

## Custom architectures

Any network can replace `cfg.pl_module.network` as long as its `forward` accepts
`(x, steps, ensemble_size)` and returns `[batch, steps, out_channels, H, W]`.
See the [custom network interface](api-reference.md#custom-network-interface) and
the [worked example](examples.md#custom-network-architecture).
