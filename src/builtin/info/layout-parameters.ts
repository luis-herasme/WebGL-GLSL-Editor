import { ILayoutParameter } from '../interfaces';

export const layoutParameters: Array<ILayoutParameter> = [
    {
        name: 'location',
        assignable: true,
    },
    {
        name: 'shared',
    },
    {
        name: 'packed',
    },
    {
        name: 'std140',
    },
    {
        name: 'row_major',
    },
    {
        name: 'column_major',
    },
    {
        name: 'num_views',
        assignable: true,
        extension: 'GL_OVR_multiview2',
    },
];
