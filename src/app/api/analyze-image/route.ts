import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Configurar timeout maior para a rota
export const maxDuration = 60 // 60 segundos
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API Key da OpenAI não configurada. Configure a variável OPENAI_API_KEY' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 50000, // 50 segundos de timeout
      maxRetries: 2, // Tentar 2 vezes em caso de falha
    })

    // Usar o melhor modelo disponível: gpt-4o (GPT-4 Omni - otimizado para visão)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em análise corporal e fitness. Analise a imagem fornecida com MÁXIMO DETALHAMENTO e extraia TODAS as informações possíveis sobre a pessoa, incluindo:

1. CARACTERÍSTICAS FÍSICAS DETALHADAS:
   - Peso estimado (em kg, seja o mais preciso possível)
   - Altura estimada (em cm, baseado em proporções corporais)
   - Idade estimada (faixa etária precisa)
   - Sexo/Gênero
   - Tipo corporal (ectomorfo, mesomorfo, endomorfo)
   - Percentual de gordura corporal estimado
   - Massa muscular aparente (baixa, média, alta)
   - Postura corporal

2. CONDICIONAMENTO FÍSICO:
   - Nível de condicionamento aparente (iniciante, intermediário, avançado)
   - Áreas musculares mais desenvolvidas
   - Áreas que precisam de mais trabalho
   - Sinais de atividade física regular

3. OBJETIVO RECOMENDADO (baseado na análise):
   - Perda de peso, ganho de massa, definição muscular, ou manutenção
   - Justificativa detalhada para o objetivo

4. RECOMENDAÇÕES DE TREINO:
   - Frequência semanal ideal (quantos dias)
   - Tipo de treino mais adequado
   - Intensidade recomendada
   - Áreas prioritárias para trabalhar

5. EQUIPAMENTO SUGERIDO:
   - Academia completa, treino em casa, peso corporal, etc.
   - Justificativa

6. ORÇAMENTO ESTIMADO:
   - Faixa de orçamento mensal sugerida para alimentação fitness (em R$)
   - Baseado no objetivo e necessidades nutricionais

7. OBSERVAÇÕES ADICIONAIS:
   - Qualquer detalhe relevante sobre saúde aparente
   - Recomendações especiais
   - Pontos de atenção

Retorne a análise em formato JSON estruturado com TODOS esses campos preenchidos de forma DETALHADA e PRECISA.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analise esta imagem em MÁXIMO DETALHAMENTO e forneça todas as informações solicitadas no formato JSON estruturado.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high' // Máxima qualidade de análise
              }
            }
          ]
        }
      ],
      max_tokens: 2000, // Permitir resposta detalhada
      temperature: 0.3, // Baixa temperatura para respostas mais precisas e consistentes
    })

    const analysisText = response.choices[0]?.message?.content

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Não foi possível analisar a imagem' },
        { status: 500 }
      )
    }

    // Tentar extrair JSON da resposta
    let analysisData
    try {
      // Remover markdown code blocks se existirem
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || analysisText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText
      analysisData = JSON.parse(jsonString)
    } catch (parseError) {
      // Se não conseguir parsear, retornar o texto bruto
      analysisData = {
        raw_analysis: analysisText,
        error: 'Resposta não está em formato JSON válido'
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      raw_text: analysisText,
      model_used: 'gpt-4o',
      tokens_used: response.usage?.total_tokens || 0
    })

  } catch (error: any) {
    console.error('Erro na análise de imagem:', error)
    
    // Tratamento específico para diferentes tipos de erro
    let errorMessage = 'Erro ao processar análise de imagem'
    let errorHint = 'Tente novamente em alguns instantes'
    
    if (error.message?.includes('API key')) {
      errorMessage = 'API Key da OpenAI inválida ou não configurada'
      errorHint = 'Configure a variável OPENAI_API_KEY nas configurações do projeto'
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      errorMessage = 'Tempo limite excedido ao processar a imagem'
      errorHint = 'A imagem pode ser muito grande. Tente com uma imagem menor ou aguarde e tente novamente'
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Limite de requisições da OpenAI excedido'
      errorHint = 'Aguarde alguns minutos antes de tentar novamente'
    } else if (error.message?.includes('invalid_image')) {
      errorMessage = 'Imagem inválida ou inacessível'
      errorHint = 'Verifique se a URL da imagem é válida e pública'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        hint: errorHint,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
}
