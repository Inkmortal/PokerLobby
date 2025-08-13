impl :: bincode :: Decode for BunchingData
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        Ok(Self
        {
            fold_ranges : :: bincode :: Decode :: decode(decoder) ?, flop : ::
            bincode :: Decode :: decode(decoder) ?, phase : :: bincode ::
            Decode :: decode(decoder) ?, progress_percent : :: bincode ::
            Decode :: decode(decoder) ?, temp_table1 : :: bincode :: Decode ::
            decode(decoder) ?, temp_table2 : :: bincode :: Decode ::
            decode(decoder) ?, temp_table3 : :: bincode :: Decode ::
            decode(decoder) ?, sum : :: bincode :: Decode :: decode(decoder)
            ?, result4 : :: bincode :: Decode :: decode(decoder) ?, result5 :
            :: bincode :: Decode :: decode(decoder) ?, result6 : :: bincode ::
            Decode :: decode(decoder) ?,
        })
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for BunchingData
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        Ok(Self
        {
            fold_ranges : :: bincode :: BorrowDecode :: borrow_decode(decoder)
            ?, flop : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            phase : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            progress_percent : :: bincode :: BorrowDecode ::
            borrow_decode(decoder) ?, temp_table1 : :: bincode :: BorrowDecode
            :: borrow_decode(decoder) ?, temp_table2 : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?, temp_table3 : :: bincode
            :: BorrowDecode :: borrow_decode(decoder) ?, sum : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?, result4 : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?, result5 : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?, result6 : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?,
        })
    }
}