import { BadRequestException, HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

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

    const totalProducts = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalProducts / limit);

    if (page > lastPage) {
      throw new RpcException({
        message: `Page number ${page} does not exist.`,
        status: HttpStatus.NOT_FOUND
      })
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
        total: totalProducts,
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
      throw new RpcException({
        message: `Product with the id ${id} does not exist`,
        status: HttpStatus.NOT_FOUND
      })
    };

    return product
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: __, ...data } = updateProductDto;

    const { name, price } = updateProductDto;

    if (!name && !price) {
      throw new RpcException({
        message: 'no valid data received',
        status: HttpStatus.BAD_REQUEST
      })
    }

    const product = await this.product.findUnique({
      where: { id, available: true }
    });

    if (!product) {
      throw new RpcException({
        message: `Product with the id ${id} does not exist`,
        status: HttpStatus.NOT_FOUND
      })
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
      throw new RpcException({
        message: `Product with the id ${id} does not exist`,
        status: HttpStatus.NOT_FOUND
      })

    };

    return await this.product.update({
      where: { id },
      data: {
        available: false
      }
    })
  }

  async validateProducts(ids: number[]) {

    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some products where not found',
        status: HttpStatus.NOT_FOUND
      })
    }

    return products

  }
}
