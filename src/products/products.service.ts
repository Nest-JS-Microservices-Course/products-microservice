import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect()
    this.logger.log('Database connected');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {

    const { page, limit } = paginationDto;

    const totalPages = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPages / limit);

    if (page > lastPage) {
      throw new NotFoundException(`Page number ${page} does not exist.`)
    }

    return {
      data: await this.product.findMany({
        where: {
          available: true
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      metadata: {
        total: totalPages,
        page: page,
        lastPage,
      }

    }
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { id, available: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with the id ${id} does not exist`)
    };

    return product
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: __, ...data } = updateProductDto;

    const { name, price } = updateProductDto;

    if (!name && !price) {
      throw new BadRequestException('Error: no data received')
    }

    const product = await this.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException(`Product with the id ${id} does not exist`)
    };

    return this.product.update({
      where: { id },
      data
    })

  }

  async remove(id: number) {

    const product = await this.product.findUnique({
      where: { id, available: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with the id ${id} does not exist`)
    };

    return await this.product.update({
      where: { id },
      data: {
        available: false
      }
    })
  }
}
