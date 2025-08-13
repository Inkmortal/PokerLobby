impl :: bincode :: Decode for ActionTreeNode
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        Ok(Self
        {
            player : :: bincode :: Decode :: decode(decoder) ?, board_state :
            :: bincode :: Decode :: decode(decoder) ?, amount : :: bincode ::
            Decode :: decode(decoder) ?, actions : :: bincode :: Decode ::
            decode(decoder) ?, children : :: bincode :: Decode ::
            decode(decoder) ?,
        })
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for ActionTreeNode
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        Ok(Self
        {
            player : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            board_state : :: bincode :: BorrowDecode :: borrow_decode(decoder)
            ?, amount : :: bincode :: BorrowDecode :: borrow_decode(decoder)
            ?, actions : :: bincode :: BorrowDecode :: borrow_decode(decoder)
            ?, children : :: bincode :: BorrowDecode :: borrow_decode(decoder)
            ?,
        })
    }
}