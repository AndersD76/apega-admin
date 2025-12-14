const { PrismaClient } = require('@prisma/client');
const uploadService = require('../services/upload.service');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

class PecasController {
  // Listar peças aprovadas (marketplace público)
  async list(req, res) {
    try {
      const {
        categoria,
        marca,
        tamanho,
        genero,
        estado,
        precoMin,
        precoMax,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Construir filtros
      const where = {
        status: 'APROVADA'
      };

      if (categoria) where.categoria = categoria;
      if (marca) where.marca = { contains: marca, mode: 'insensitive' };
      if (tamanho) where.tamanho = tamanho;
      if (genero) where.genero = genero;
      if (estado) where.estado = estado;

      if (precoMin || precoMax) {
        where.preco = {};
        if (precoMin) where.preco.gte = parseFloat(precoMin);
        if (precoMax) where.preco.lte = parseFloat(precoMax);
      }

      if (search) {
        where.OR = [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { marca: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Paginação
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Buscar peças
      const [pecas, total] = await Promise.all([
        prisma.peca.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            consignador: {
              select: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.peca.count({ where })
      ]);

      res.json({
        success: true,
        data: pecas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Erro ao listar peças:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao buscar peças'
      });
    }
  }

  // Obter detalhes de uma peça
  async getById(req, res) {
    try {
      const { id } = req.params;

      const peca = await prisma.peca.findUnique({
        where: { id },
        include: {
          consignador: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!peca) {
        return res.status(404).json({
          error: true,
          message: 'Peça não encontrada'
        });
      }

      // Apenas peças aprovadas são visíveis publicamente
      if (peca.status !== 'APROVADA' && !req.user) {
        return res.status(404).json({
          error: true,
          message: 'Peça não encontrada'
        });
      }

      res.json({
        success: true,
        data: peca
      });

    } catch (error) {
      console.error('Erro ao buscar peça:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao buscar peça'
      });
    }
  }

  // Criar nova peça
  async create(req, res) {
    try {
      const {
        titulo,
        descricao,
        marca,
        categoria,
        tamanho,
        genero,
        estado,
        preco,
        precoOriginal,
        medidas,
        autenticidadeVerificada
      } = req.body;

      // Validações
      if (!titulo || !descricao || !marca || !categoria || !tamanho || !preco) {
        return res.status(400).json({
          error: true,
          message: 'Campos obrigatórios faltando'
        });
      }

      // Verificar se há imagens
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: true,
          message: 'Pelo menos uma imagem é obrigatória'
        });
      }

      // Processar e fazer upload das imagens
      console.log(`Processando ${req.files.length} imagens...`);
      const uploadResults = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const publicId = `peca_${uuidv4()}`;

        const result = await uploadService.uploadImage(file.buffer, {
          folder: 'brecho/pecas',
          publicId: publicId,
          removeBackground: false // Pode ser ativado depois
        });

        uploadResults.push(result.urls.original.jpeg); // URL principal
      }

      // Determinar se precisa aprovação
      const consignadorId = req.user.role === 'CONSIGNADOR' ? req.user.consignador.id : null;
      const status = req.user.role === 'ADMIN' ? 'APROVADA' : 'PENDENTE_APROVACAO';

      // Criar peça no banco
      const peca = await prisma.peca.create({
        data: {
          titulo,
          descricao,
          marca,
          categoria,
          tamanho,
          genero,
          estado,
          preco: parseFloat(preco),
          precoOriginal: precoOriginal ? parseFloat(precoOriginal) : null,
          fotos: uploadResults,
          medidas: medidas ? JSON.parse(medidas) : null,
          autenticidadeVerificada: autenticidadeVerificada === 'true',
          consignadorId,
          status
        },
        include: {
          consignador: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // TODO: Enviar notificação para admin se for consignação

      res.status(201).json({
        success: true,
        message: status === 'APROVADA'
          ? 'Peça criada e publicada com sucesso'
          : 'Peça criada e aguardando aprovação',
        data: peca
      });

    } catch (error) {
      console.error('Erro ao criar peça:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao criar peça',
        details: error.message
      });
    }
  }

  // Atualizar peça
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Buscar peça
      const peca = await prisma.peca.findUnique({
        where: { id },
        include: { consignador: true }
      });

      if (!peca) {
        return res.status(404).json({
          error: true,
          message: 'Peça não encontrada'
        });
      }

      // Verificar permissão
      const isOwner = peca.consignadorId === req.user.consignador?.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: true,
          message: 'Sem permissão para editar esta peça'
        });
      }

      // Não permitir alterar status (usar rotas específicas)
      delete updateData.status;
      delete updateData.consignadorId;

      // Atualizar
      const pecaAtualizada = await prisma.peca.update({
        where: { id },
        data: updateData
      });

      res.json({
        success: true,
        message: 'Peça atualizada com sucesso',
        data: pecaAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar peça:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao atualizar peça'
      });
    }
  }

  // Deletar peça
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Buscar peça
      const peca = await prisma.peca.findUnique({
        where: { id },
        include: { venda: true }
      });

      if (!peca) {
        return res.status(404).json({
          error: true,
          message: 'Peça não encontrada'
        });
      }

      // Verificar se já foi vendida
      if (peca.venda) {
        return res.status(400).json({
          error: true,
          message: 'Não é possível deletar peça já vendida'
        });
      }

      // Verificar permissão
      const isOwner = peca.consignadorId === req.user.consignador?.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: true,
          message: 'Sem permissão para deletar esta peça'
        });
      }

      // Deletar (ou marcar como removida)
      await prisma.peca.update({
        where: { id },
        data: { status: 'REMOVIDA' }
      });

      // TODO: Deletar imagens do Cloudinary

      res.json({
        success: true,
        message: 'Peça removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar peça:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao deletar peça'
      });
    }
  }

  // Listar minhas peças (consignador)
  async listMyPecas(req, res) {
    try {
      const consignadorId = req.user.consignador?.id;

      if (!consignadorId) {
        return res.status(400).json({
          error: true,
          message: 'Usuário não é consignador'
        });
      }

      const pecas = await prisma.peca.findMany({
        where: { consignadorId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: pecas
      });

    } catch (error) {
      console.error('Erro ao listar minhas peças:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao buscar peças'
      });
    }
  }

  // Aprovar peça (admin)
  async aprovar(req, res) {
    try {
      const { id } = req.params;

      const peca = await prisma.peca.update({
        where: { id },
        data: {
          status: 'APROVADA',
          motivoRejeicao: null
        },
        include: {
          consignador: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // TODO: Enviar notificação para consignador

      res.json({
        success: true,
        message: 'Peça aprovada com sucesso',
        data: peca
      });

    } catch (error) {
      console.error('Erro ao aprovar peça:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao aprovar peça'
      });
    }
  }

  // Rejeitar peça (admin)
  async rejeitar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({
          error: true,
          message: 'Motivo da rejeição é obrigatório'
        });
      }

      const peca = await prisma.peca.update({
        where: { id },
        data: {
          status: 'REJEITADA',
          motivoRejeicao: motivo
        },
        include: {
          consignador: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // TODO: Enviar notificação para consignador

      res.json({
        success: true,
        message: 'Peça rejeitada',
        data: peca
      });

    } catch (error) {
      console.error('Erro ao rejeitar peça:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao rejeitar peça'
      });
    }
  }

  // Listar peças pendentes (admin)
  async listPendentes(req, res) {
    try {
      const pecas = await prisma.peca.findMany({
        where: { status: 'PENDENTE_APROVACAO' },
        orderBy: { createdAt: 'asc' },
        include: {
          consignador: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: pecas,
        total: pecas.length
      });

    } catch (error) {
      console.error('Erro ao listar peças pendentes:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao buscar peças'
      });
    }
  }

  // Listar por categoria
  async listByCategoria(req, res) {
    try {
      const { categoria } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [pecas, total] = await Promise.all([
        prisma.peca.findMany({
          where: {
            categoria,
            status: 'APROVADA'
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.peca.count({
          where: {
            categoria,
            status: 'APROVADA'
          }
        })
      ]);

      res.json({
        success: true,
        data: pecas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Erro ao listar por categoria:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao buscar peças'
      });
    }
  }

  // Listar por marca
  async listByMarca(req, res) {
    try {
      const { marca } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [pecas, total] = await Promise.all([
        prisma.peca.findMany({
          where: {
            marca: { contains: marca, mode: 'insensitive' },
            status: 'APROVADA'
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.peca.count({
          where: {
            marca: { contains: marca, mode: 'insensitive' },
            status: 'APROVADA'
          }
        })
      ]);

      res.json({
        success: true,
        data: pecas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Erro ao listar por marca:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao buscar peças'
      });
    }
  }
}

module.exports = new PecasController();
