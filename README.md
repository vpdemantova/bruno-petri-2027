# Bruno Petri

O site do artista **Bruno Petri** ("Transcendental Geometrical Art"), construído a partir das dez telas de referência: Home, Spyglass, Galeria em lista e em grade, Obra, e as versões de celular de cada uma. A Loja e a página Sobre não estavam nas telas e foram desenhadas na mesma linguagem. Feito em 11/out/2026.

## Rodar

```
npm install
npm run dev        # http://localhost:5200
npm run build      # confere os tipos e gera dist/
npm run preview    # serve o dist/ em http://localhost:5201
```

No fim do endereço:
- `?webgl` força o WebGL2, para conferir o caminho de quem não tem WebGPU;
- `?semabertura` pula a abertura;
- `?lang=en` abre em inglês.

**Nada foi publicado.** Para pôr no ar:
1. crie um repositório no GitHub e envie;
2. na Vercel, crie um projeto ligado a ele, com o "Framework preset" **Vite**;
3. use o build `npm run build` e a pasta `dist`. O `vercel.json` manda todo endereço para o `index.html`, então links diretos como `/cruz-fractal` funcionam.

**Antes de publicar**, ver as tarefas P1 do `TAREFAS.md`: confirmar as obras com o artista, o e-mail e o Instagram dele, e as fotos das pinturas.

## As páginas

| Endereço | O que é |
|---|---|
| `/` | **Home.** O painel preto com a frase, o logotipo, o texto e o menu; a Cruz Fractal girando à direita; o botão redondo leva ao Spyglass. |
| `/spyglass/<obra>` | **Spyglass.** A obra na tela inteira e os quatro cantos levando às páginas. O "i" abre a ficha; os seis pontos de "Explore every angle" levam a câmera a seis ângulos (o 2º é o close das telas). Arrastar gira, a roda aproxima, ← → trocam o ângulo e 1–6 escolhem. |
| `/galeria` | **Galeria em lista.** A obra do momento enorme, cortada pela borda, e o carrossel vertical no painel preto (roda, arrastar ou ↑ ↓; Enter abre). |
| `/galeria?vista=grade` | **Galeria em grade.** Os cartões redondos com a seta. Passar o mouse faz a obra girar e aparecer à esquerda. |
| `/<obra>` | **Obra**, por exemplo `/cruz-fractal`. A obra para girar, o botão de ampliar (vai ao Spyglass), a ficha (← nome →, material, tamanho, situação, série) e o texto com **Comprar na loja**. No lugar do retângulo cinza da tela entraram o **configurador de material** e três vistas. |
| `/loja` | **Loja.** Cartões com a situação (disponível, sob consulta, estudo), o material escolhido e "Adicionar à lista". A **lista de interesse** é uma gaveta: quantidade, recado e nome, e depois "Enviar por e-mail" ou "Copiar o pedido". |
| `/sobre` | **Sobre.** O artista, as seis matérias com todas as variações em amostras 3D, a geometria por trás das formas (φ, √2, 137,5°, sólidos de Platão), o contato e os créditos. |

As palavras do menu ficam em português, como nas telas, e passam para o inglês na troca de idioma (pt-br / en). A troca é animada: o texto sai e o outro entra.

## O 3D

### Um renderizador para o site inteiro
`src/three/engine.ts` cria **um** `WebGPURenderer` do three.js (com WebGL2 de reserva). Cada obra que aparece na página é um `<canvas>` 2D comum dentro do HTML, com cantos redondos, bordas, ícones por cima e as animações do próprio CSS. O renderizador desenha a vista num canto do canvas dele, que fica fora da tela, e copia o resultado com `drawImage`.

Por que assim:
- **um contexto de GPU só:** o navegador limita a uns 16;
- **cada shader é compilado uma vez;**
- **a vista parada não custa nada:** um cartão da grade é desenhado uma vez e fica lá. Só redesenham, a cada quadro, o herói, o visualizador e o cartão sob o mouse.

### O voo entre as páginas
Quando uma página sai e outra entra com a mesma obra, a obra **voa** do lugar antigo para o novo, num canvas por cima de tudo, com a câmera e o enquadramento animados por molas. Ao mesmo tempo, o **painel preto** (o mesmo elemento, com `layoutId` do Motion) desliza e muda de forma: da esquerda (Home) para a direita (Galeria), e daí para o cartão do texto (Obra). As pílulas do menu também viajam de uma posição para a outra.

### As esculturas
`src/three/sculptures.ts` tem um gerador por forma. Cada um monta a obra com peças (caixas, molduras, anéis de seção quadrada, barras, sólidos) e as junta numa geometria só.

As duas formas das telas foram **medidas**. A Cruz Fractal, em larguras de viga w:
- vigas de seção quadrada, de 6,7w;
- quatro losangos com centro em (±1,33w, ±1,33w), meia-diagonal externa de 1,76w e interna de 0,76w;
- o canto de dentro de cada losango encosta na face de trás da viga.

Basta um quadrante, espelhado. A Molécula é a mesma cruz nos três planos.

As outras saem da geometria e da proporção, e todas aparecem marcadas como **estudo**:
- Espiral Áurea: molduras inscritas, com os cantos na razão áurea;
- Coluna Áurea: o ângulo de 137,5°;
- Torre √2: o quadrado inscrito no quadrado;
- Estrela Tetraédrica, Octaedro Estrelado, Dodecaedro, Esfera Armilar, Flor da Vida, Mandala Cúbica, Hipercubo, Portal, Ninho e Arcos;
- três luminárias acesas: Lanterna, Halo e Prisma.

A **Tríade** é o triângulo impossível. As três barras correm ao longo de x, y e z, e de frente, com a lente longa, parecem fechar o triângulo. Ao girar, aparece o segredo.

### Os materiais (`src/three/materials.ts`)
Não há fotos: cada material é uma fórmula em **TSL**, calculada pela posição do ponto. Por isso o veio do mármore e o anel da madeira atravessam todas as faces, como se a obra tivesse saído de um bloco só. São seis famílias:

- **mármore:** Bardiglio (o das telas), Bardiglio claro, Carrara, Calacatta, Nero Marquina, Verde Guatemala, Rosa Portogallo, Travertino e Azul Bahia;
- **madeira:** carvalho, nogueira, freijó, ipê, cerejeira, pinus, freixo claro e ebanizada, cada uma fosca, acetinada ou com verniz brilhante;
- **vidro:** cristal, fumê, âmbar, cobalto, esmeralda, rosé, jateado e dicroico;
- **gesso:** branco, marfim, areia, cinza, cimento queimado, terracota, rosa e azul-cinza;
- **metal:** aço escovado, inox polido, latão, bronze, cobre, ouro, alumínio jateado, pátina verde, titânio anodizado, aço corten e aço negro;
- **laca:** as três cores da assinatura e mais seis.

Por desempenho:
- **um shader por família.** As cores e números da variante, e a semente que muda o desenho de obra para obra, vão no próprio objeto e chegam ao shader por uniforms de objeto (`onObjectUpdate`). Trocar o material não compila nada;
- **o ruído vem de uma textura 3D** de 64³ (`src/three/noise.ts`), calculada uma vez na abertura. Calcular o ruído de Perlin dentro do shader fazia o Windows levar de 8 a 15 s para compilar na primeira visita; com a textura, a abertura inteira leva uns 4 s, e 1 s quando o navegador já guardou os shaders;
- **tudo é compilado durante a abertura.** O three não desenha nada enquanto um `compileAsync` está em curso, e por isso a compilação acontece uma vez só, antes de qualquer vista.

**A luz:** um estúdio feito em código (sala escura, três softboxes e o chão claro) é o reflexo dos metais, da laca e do vidro. A luz principal acompanha a câmera, como num estúdio de fotografia, e dá a sombra dentro das molduras.

### As pinturas e as mandalas (`src/three/flat.ts`)
Geradas por semente, ficam no lugar das obras do artista **até chegarem as fotos**.
- **A pintura a óleo:** cada pincelada é um feixe de cerdas. A mesma pincelada, em cinza, vira o relevo, e a tinta grossa pega a luz rasante no 3D.
- **A mandala:** desenhada a compasso e régua em simetria de n, em ouro sobre preto (com o traço em metal no 3D) ou em nanquim sobre papel.

## Pôr uma obra

Cada obra é um item em `src/data/works.ts`:
- `slug` (o endereço);
- título em pt e en;
- categoria e série;
- tipo: escultura (com o gerador), pintura ou mandala;
- material padrão e as famílias que ela aceita;
- tamanho e situação;
- `origin`: `"obra"` para as do artista, `"estudo"` para as formas desenhadas aqui;
- os parágrafos em pt e en.

A ordem do arquivo é a ordem da galeria e da loja.

**Regra: nada inventado.** Preço, e-mail, Instagram, exposições e medidas só entram quando o artista confirmar. Campo vazio esconde o botão ou mostra um aviso. Os dados dele estão em `src/data/artist.ts`.

## Pastas

```
src/main.tsx          entrada: fontes, estilos, App
src/app/              App (abertura e transições), router, store (zustand), i18n
src/pages/            Home, Spyglass, Gallery, Work (a obra), Shop (+ lista), About
src/ui/               Piece3D (a vista 3D), FlatThumb, Logo, Icons, kit (menu, idioma, painel, filtro)
src/three/            engine, sculptures, geometry, materials, noise, flat, piece, warm
src/data/             works (as obras), artist
src/styles/app.css    tudo do visual, desktop e celular
```

## De onde saíram as medidas e as fontes

- **As cores**, medidas nas telas: amarelo `#FCE818`, magenta `#C42C8C`, ciano `#6CC8D8`, papel `#E8E6E5`. O mármore Bardiglio fica entre `#ACAFB5` e `#575E66`.
- **As fontes**, todas livres (licença SIL Open Font):
  - **Syne** na interface e no texto (o "1996" com o 9 descendo, como na tela);
  - **Lexend 600** no logotipo;
  - **Cormorant Garamond** itálica na frase.
- **O "n" do logotipo** foi medido na tela e redesenhado (`src/ui/Logo.tsx`):
  - a haste esquerda, em magenta, desce e vira um quarto de círculo até a base;
  - um quarto de círculo em ciano sobe acima da altura-x e desce na haste direita;
  - o traço tem 0,388 da altura-x (que na Lexend 600 é 0,531 em).
- **As medidas da página** vêm das telas, levadas a 1440 px, em `vw` e `vh`. No celular (até 899 px, ou com a tela em pé) há outro jogo de medidas.
