import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import {
  CreateRecipeDto,
  CreateRecipeVersionDto,
  UpdateRecipeVersionDto,
  UpdateRecipeNameDto,
  RecommendRecipeDto,
  GenerateOptimizationDto,
  ReviewVersionDto,
} from './dto/recipe.dto';

@Controller('api/recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get()
  findAll() {
    return this.recipeService.findAll();
  }

  @Get('versions/published')
  findAllPublishedVersions() {
    return this.recipeService.findAllPublishedVersions();
  }

  @Get('recommend')
  recommend(@Query() dto: RecommendRecipeDto) {
    return this.recipeService.recommend(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipeService.findOne(id);
  }

  @Get(':id/versions')
  findVersions(@Param('id') id: string) {
    return this.recipeService.findVersions(id);
  }

  @Get('versions/:versionId')
  findVersion(@Param('versionId') versionId: string) {
    return this.recipeService.findVersion(versionId);
  }

  @Get('versions/compare/:v1/:v2')
  compareVersions(
    @Param('v1') v1: string,
    @Param('v2') v2: string,
  ) {
    return this.recipeService.compareVersions(v1, v2);
  }

  @Post()
  create(@Body() dto: CreateRecipeDto) {
    return this.recipeService.create(dto);
  }

  @Post('versions')
  createVersion(@Body() dto: CreateRecipeVersionDto) {
    return this.recipeService.createVersion(dto);
  }

  @Post('optimize-from-feedback')
  generateOptimization(@Body() dto: GenerateOptimizationDto) {
    return this.recipeService.generateOptimizationFromFeedback(dto);
  }

  @Put('versions/:versionId')
  updateVersion(
    @Param('versionId') versionId: string,
    @Body() dto: UpdateRecipeVersionDto,
  ) {
    return this.recipeService.updateVersion(versionId, dto);
  }

  @Put('versions/:versionId/review')
  reviewVersion(
    @Param('versionId') versionId: string,
    @Body() dto: ReviewVersionDto,
  ) {
    return this.recipeService.reviewVersion(versionId, dto.action, dto.reviewNote);
  }

  @Put(':id/name')
  updateRecipeName(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeNameDto,
  ) {
    return this.recipeService.updateRecipeName(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipeService.remove(id);
  }
}
