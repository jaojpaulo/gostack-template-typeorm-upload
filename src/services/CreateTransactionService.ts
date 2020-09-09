import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total - value < 0) {
      throw new AppError('Insufficient balance for this transaction', 400);
    }

    const categoriesRepository = getRepository(Category);

    let categoryObject = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryObject) {
      categoryObject = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(categoryObject);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryObject,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
