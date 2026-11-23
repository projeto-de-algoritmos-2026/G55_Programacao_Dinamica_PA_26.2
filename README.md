# EstudaPlan

**Conteúdo da Disciplina:** Programação Dinâmica<br>

> **Status: em desenvolvimento.** Nenhuma funcionalidade está implementada ainda. Os itens abaixo marcados com `[ ]` estão pendentes e serão marcados como concluídos só depois de implementados e testados.

## Alunos

| Foto | Nome | Matrícula |
| :---: | :--- | ---: |
| ![Gabriel Lima](https://github.com/gabriel-lima258.png?size=100) | **Gabriel Lima** | 222037610 |
| ![Mateus Bastos](https://github.com/MateuSansete.png?size=100) | **Mateus Bastos** | 211062240 |

---

## Sobre

Um estudante tem um tempo livre limitado (por exemplo, 3 horas numa tarde) e uma lista de atividades de estudo maior do que cabe nesse tempo. Cada atividade tem uma duração e uma prioridade que **o próprio estudante** atribui. A pergunta é:

> Quais atividades fazer para que a soma das prioridades seja a maior possível, sem ultrapassar o tempo disponível?

O **EstudaPlan** é uma aplicação web em que o usuário cadastra as atividades, informa o tempo disponível e recebe a seleção ótima, calculada pelo problema da **Mochila 0/1 com programação dinâmica**. A aplicação também mostra o que uma heurística gulosa escolheria e por que ela pode errar.

### Modelagem

| Mochila 0/1 | EstudaPlan |
|---|---|
| Item | Atividade de estudo |
| Peso `wᵢ` | Duração `dᵢ` em minutos (inteiro, `dᵢ ≥ 1`) |
| Valor `vᵢ` | Prioridade `pᵢ` (inteiro de 1 a 10) |
| Capacidade `W` | Tempo disponível `T` em minutos |

O objetivo é escolher um subconjunto `S` de atividades que maximize `Σ pᵢ` com `Σ dᵢ ≤ T`. Cada atividade entra no máximo uma vez e é indivisível.

### Limitações

- A prioridade é uma nota do usuário. A soma das prioridades **não é uma previsão de aprendizado**.
- O algoritmo escolhe **quais** atividades fazer, não **em que ordem** estudá-las.
- Não há horários fixos, conflitos de agenda, pré-requisitos, cotas por disciplina nem múltiplas restrições.

---

## Funcionalidades e Algoritmos

### Algoritmos previstos

| # | Algoritmo | Estratégia | Complexidade | Ótimo? |
|:-:|---|---|:-:|:-:|
| 1 | **Mochila 0/1** | Programação dinâmica com tabela 2D e reconstrução | Θ(n·T) | Sim |
| 2 | **Guloso por prioridade/duração** | Ordena pela razão `p/d` e inclui o que couber | O(n log n) | Não |
| 3 | **Força bruta** | Enumeração dos `2ⁿ` subconjuntos, só para validar a PD nos testes | O(2ⁿ · n) | Sim |

A recorrência da PD é:

```
OPT[i][t] = OPT[i-1][t]                                   se dᵢ > t
OPT[i][t] = max( OPT[i-1][t],  pᵢ + OPT[i-1][t - dᵢ] )    se dᵢ ≤ t
```

com `OPT[0][t] = 0`. A resposta é `OPT[n][T]`. O tempo `Θ(n·T)` é **pseudopolinomial**: cresce com o valor de `T`, não com o número de bits da entrada.

### Funcionalidades da aplicação

- [ ] Cadastro, edição e remoção de atividades
- [ ] Exemplos locais prontos para demonstração
- [ ] Seleção ótima por programação dinâmica, com selecionadas, descartadas, tempo usado, tempo restante e prioridade total
- [ ] Comparação com a heurística gulosa, identificada como sem garantia de otimalidade
- [ ] Contraexemplo em que o guloso perde para a PD
- [ ] Visualização didática da tabela de PD e do caminho de reconstrução, para instâncias pequenas
- [ ] Testes de corretude e comparação com força bruta

---

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, uv, FastAPI, Pydantic, Uvicorn, pytest |
| Infraestrutura | Docker e Docker Compose |

---

## Estrutura do Projeto

```
G55_Programacao_Dinamica_PA_26.2/
├── backend/
│   ├── app/
│   │   └── algoritmos/     # PD, guloso e força bruta como funções puras
│   └── tests/
├── frontend/
├── docs/
│   └── img/                # capturas reais da aplicação
└── README.md
```

---

## Instalação e Execução

Pendente. As instruções serão adicionadas quando o backend e o frontend estiverem rodando.

---

## Screenshots

Pendente.

---

## Apresentação

Pendente.

---

## Referências

- KLEINBERG, Jon; TARDOS, Éva. *Algorithm Design*. Boston: Pearson, 2006. Capítulo 6: Dynamic Programming.
- CORMEN, Thomas H. et al. *Introduction to Algorithms*. 4. ed. Cambridge: MIT Press, 2022. Capítulo 14: Dynamic Programming.
- Material da disciplina Projeto de Algoritmos, FGA/UnB, 2026.2.

---

## Licença

Projeto acadêmico desenvolvido para a disciplina Projeto de Algoritmos da Universidade de Brasília, campus Gama.
